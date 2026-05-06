import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentService, Equipment } from '../services/equipment.service';
import { ThemeService } from '../services/theme.service';
import { Subscription, interval, startWith, switchMap } from 'rxjs';
import * as L from 'leaflet';

@Component({
  selector: 'app-equipment-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipment-overview.component.html',
  styleUrl: './equipment-overview.component.css'
})
export class EquipmentOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  equipments: Equipment[] = [];
  loading = true;
  mapOpen = true;
  listOpen = true;
  selectedEquipmentId: number | null = null;
  incidents: any[] = [];
  loadingIncidents = false;
  private mapMarkers: Map<number, L.CircleMarker> = new Map();
  private pollingSub?: Subscription;

  get selectedEquipment(): Equipment | undefined {
    return this.equipments.find(e => e.id === this.selectedEquipmentId);
  }

  private map: L.Map | undefined;

  @ViewChild('mapElement') mapElement!: ElementRef;

  constructor(
    private equipmentService: EquipmentService,
    public themeService: ThemeService
  ) {}

  ngOnInit() {
    this.pollingSub = interval(10000)
      .pipe(
        startWith(0),
        switchMap(() => this.equipmentService.getEquipmentGeoData())
      )
      .subscribe({
        next: (data) => {
          this.equipments = data;
          this.loading = false;
          this.updateMarkers();
        },
        error: (err) => console.error('Equipment poll error:', err)
      });
  }

  ngAfterViewInit() {
    // Wait for data + DOM to be ready before initialising Leaflet
    setTimeout(() => {
      if (!this.loading && !this.map) {
        this.initMap();
      } else {
        // Poll until data has arrived then init
        const poll = setInterval(() => {
          if (!this.loading) {
            clearInterval(poll);
            this.initMap();
          }
        }, 100);
      }
    }, 200);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    this.pollingSub?.unsubscribe();
  }

  private updateMarkers() {
    if (!this.map || !this.mapMarkers.size) return;

    this.equipments.forEach(eq => {
      const marker = this.mapMarkers.get(eq.id);
      if (marker) {
        const color = this.getStatusColor(eq.status);
        marker.setStyle({ color: color, fillColor: color });
        marker.setPopupContent(`<b>${eq.reference}</b><br>${eq.type} - ${eq.city}<br>Status: ${eq.status}`);
      }
    });
  }

  toggleMap() {
    this.mapOpen = !this.mapOpen;
    if (!this.mapOpen && !this.listOpen) this.listOpen = true; // Ensure at least one is open
    setTimeout(() => {
      if (this.mapOpen) {
        if (!this.map) this.initMap();
        else this.map.invalidateSize();
      }
    }, 500); // Wait for CSS transition
  }

  toggleList() {
    this.listOpen = !this.listOpen;
    if (!this.listOpen && !this.mapOpen) {
      this.mapOpen = true;
      setTimeout(() => {
        if (!this.map) this.initMap();
        else this.map.invalidateSize();
      }, 500);
    } else if (this.mapOpen) {
      setTimeout(() => this.map?.invalidateSize(), 500);
    }
  }

  selectEquipment(id: number) {
    this.selectedEquipmentId = id;
    this.incidents = [];
    this.loadingIncidents = true;

    this.equipmentService.getEquipmentIncidents(id).subscribe({
      next: (data) => {
        this.incidents = data;
        this.loadingIncidents = false;
      },
      error: (err) => {
        console.error('Failed to load incidents:', err);
        this.loadingIncidents = false;
      }
    });
    
    if (!this.mapOpen) this.toggleMap();
    if (!this.listOpen) this.toggleList();

    this.mapMarkers.forEach((marker, markerId) => {
      const eq = this.equipments.find(e => e.id === markerId);
      if (eq) {
        let defaultColor = this.getStatusColor(eq.status);
        
        if (markerId === id) {
           marker.setStyle({ color: '#2563eb', fillColor: '#2563eb', radius: 14, fillOpacity: 1 });
           marker.openPopup();
        } else {
           marker.setStyle({ color: defaultColor, fillColor: defaultColor, radius: 8, fillOpacity: 0.6 });
        }
      }
    });

    setTimeout(() => {
      const row = document.getElementById(`eq-row-${id}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  }

  clearSelection() {
    this.selectedEquipmentId = null;
  }

  changeStatus(newStatus: string) {
    if (this.selectedEquipmentId) {
      this.equipmentService.updateStatus(this.selectedEquipmentId, newStatus).subscribe({
        next: (updated) => {
          // Update local state immediately
          const index = this.equipments.findIndex(e => e.id === updated.id);
          if (index !== -1) {
            this.equipments[index].status = updated.status;
            this.updateMarkers();
          }
        },
        error: (err) => console.error('Failed to update status:', err)
      });
    }
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'INACTIVE': return '#ef4444';
      case 'MAINTENANCE': return '#f59e0b';
      case 'OUT_OF_SERVICE': return '#6366f1';
      default: return '#94a3b8'; // Slate/Gray for unknown
    }
  }

  private initMap() {
    if (!this.mapOpen || typeof L === 'undefined' || !this.mapElement) return;
    
    if (this.map) {
      this.map.remove();
      this.mapMarkers.clear();
    }

    // Fix missing marker icons in leaflet
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Define strict boundaries for Tunisia
    const tunisiaBounds = L.latLngBounds(
      L.latLng(30.0, 7.0), // South-West limits (Sahara)
      L.latLng(37.6, 11.7) // North-East limits (Cap Bon/Bizerte coast)
    );

    // Centered around Tunisia with locked bounds
    this.map = L.map(this.mapElement.nativeElement, {
      maxBounds: tunisiaBounds,
      maxBoundsViscosity: 1.0, // Prevents bounding box bouncing
      minZoom: 6
    }).setView([34.0, 9.5], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 6,
      bounds: tunisiaBounds, // Only loads tiles within these coordinates
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.equipments.forEach(eq => {
      if (eq.latitude && eq.longitude) {
        let color = this.getStatusColor(eq.status);
        const circle = L.circleMarker([eq.latitude, eq.longitude], {
          color: color,
          fillColor: color,
          fillOpacity: 0.6,
          radius: 8
        }).addTo(this.map!);
        
        circle.bindPopup(`<b>${eq.reference}</b><br>${eq.type} - ${eq.city}<br>Status: ${eq.status}`);
        
        circle.on('click', () => {
          // Trigger the Angular change detection manually using zone if needed, or normal binds
          this.selectEquipment(eq.id);
        });

        this.mapMarkers.set(eq.id, circle);
      }
    });

    setTimeout(() => this.map!.invalidateSize(), 200);
  }
}
