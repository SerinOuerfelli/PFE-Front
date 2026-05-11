import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipmentService, Equipment } from '../services/equipment.service';
import { ThemeService } from '../services/theme.service';
import { ToastService } from '../services/toast.service';
import { NotificationService } from '../services/notification.service';
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
  allEquipments: Equipment[] = [];
  searchTerm: string = '';
  loading = true;
  mapOpen = true;
  listOpen = true;
  selectedEquipmentId: number | null = null;
  incidents: any[] = [];
   loadingIncidents = false;
   downloadingReport = false;
   isDetailsOpen = false;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  private mapMarkers: Map<number, L.CircleMarker> = new Map();
  private pollingSub?: Subscription;

  get selectedEquipment(): Equipment | undefined {
    return this.equipments.find(e => e.id === this.selectedEquipmentId);
  }

  private map: L.Map | undefined;

  @ViewChild('mapElement') mapElement!: ElementRef;

  constructor(
    private equipmentService: EquipmentService,
    public themeService: ThemeService,
    private toastService: ToastService,
    @Inject(NotificationService) private notifService: NotificationService
  ) {}

  ngOnInit() {
    this.pollingSub = interval(10000)
      .pipe(
        startWith(0),
        switchMap(() => this.equipmentService.getEquipmentGeoData())
      )
      .subscribe({
        next: (data) => {
          this.allEquipments = data;
          this.applyFiltersAndSorting();
          this.loading = false;
          this.updateMarkers();
        },
        error: (err) => console.error('Equipment poll error:', err)
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (!this.loading && !this.map) {
        this.initMap();
      } else {
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
    if (!this.mapOpen && !this.listOpen) this.listOpen = true;
    setTimeout(() => {
      if (this.mapOpen) {
        if (!this.map) this.initMap();
        else this.map.invalidateSize();
      }
    }, 500);
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
    this.loadIncidents(id);
    
    if (!this.mapOpen) this.toggleMap();
    if (!this.listOpen) this.toggleList();

    this.mapMarkers.forEach((marker, markerId) => {
      const eq = this.equipments.find(e => e.id === markerId);
      if (eq) {
        let defaultColor = this.getStatusColor(eq.status);
        if (markerId === id) {
          marker.setStyle({ color: '#2563eb', fillColor: '#2563eb', radius: 14, fillOpacity: 1 });
          if (this.map) {
            marker.openPopup();
          }
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

  openDetails(id: number) {
    this.selectEquipment(id);
    this.isDetailsOpen = true;
  }

  loadIncidents(id: number) {
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
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSorting();
  }

  applyFiltersAndSorting() {
    const q = this.searchTerm.toLowerCase();
    let filtered = this.allEquipments.filter(e => 
      (e.reference?.toLowerCase() || '').includes(q) ||
      (e.city?.toLowerCase() || '').includes(q) ||
      (e.area?.toLowerCase() || '').includes(q) ||
      (e.type?.toLowerCase() || '').includes(q)
    );
    this.equipments = this.applySorting(filtered);
  }

  private applySorting(data: Equipment[]): Equipment[] {
    if (!this.sortColumn) return data;

    return [...data].sort((a, b) => {
      let valA: any = this.getPropertyValue(a, this.sortColumn);
      let valB: any = this.getPropertyValue(b, this.sortColumn);

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private getPropertyValue(obj: any, column: string): any {
    switch (column) {
      case 'reference': return obj.reference;
      case 'type': return obj.type;
      case 'location': return obj.city;
      case 'status': return obj.status;
      case 'incidents': return obj.incidentCount || 0;
      default: return '';
    }
  }

  downloadEquipmentReport() {
    if (!this.selectedEquipment) return;
    this.downloadingReport = true;
    this.equipmentService.downloadEquipmentReport(this.selectedEquipment.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Equipment_Audit_${this.selectedEquipment?.reference}_${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.downloadingReport = false;
        this.toastService.success(`Report for ${this.selectedEquipment?.reference} generated successfully.`);
        this.notifService.addNotification(`Report generated for ${this.selectedEquipment?.reference}`, 'info');
      },
      error: (err) => {
        console.error('Download error:', err);
        this.downloadingReport = false;
        this.toastService.error('Failed to generate report. Please ensure the backend is active.');
      }
    });
  }

  clearSelection() {
    this.selectedEquipmentId = null;
    this.isDetailsOpen = false;
    this.incidents = [];
  }

  changeStatus(newStatus: string) {
    if (this.selectedEquipmentId) {
      this.equipmentService.updateStatus(this.selectedEquipmentId, newStatus).subscribe({
        next: (updated) => {
          const index = this.equipments.findIndex(e => e.id === updated.id);
          if (index !== -1) {
            this.equipments[index].status = updated.status;
            
            // Also update the master list to persist across filters
            const masterIndex = this.allEquipments.findIndex(e => e.id === updated.id);
            if (masterIndex !== -1) {
              this.allEquipments[masterIndex].status = updated.status;
            }

            this.updateMarkers();
            this.toastService.success(`Status updated to ${updated.status} for ${updated.reference}`);
            this.notifService.addNotification(`Status for ${updated.reference} changed to ${updated.status}`, 'success');
          }
        },
        error: (err) => {
          console.error('Failed to update status:', err);
          this.toastService.error('Failed to update equipment status.');
        }
      });
    }
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'INACTIVE': return '#ef4444';
      case 'MAINTENANCE': return '#f59e0b';
      case 'OUT_OF_SERVICE': return '#6366f1';
      default: return '#94a3b8';
    }
  }

  private initMap() {
    if (!this.mapOpen || typeof L === 'undefined' || !this.mapElement) return;
    
    if (this.map) {
      this.map.remove();
      this.mapMarkers.clear();
    }

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

    const tunisiaBounds = L.latLngBounds(
      L.latLng(30.0, 7.0),
      L.latLng(37.6, 11.7)
    );

    this.map = L.map(this.mapElement.nativeElement, {
      maxBounds: tunisiaBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 6
    }).setView([34.0, 9.5], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 6,
      bounds: tunisiaBounds,
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
          this.selectEquipment(eq.id);
        });

        this.mapMarkers.set(eq.id, circle);
      }
    });

    setTimeout(() => this.map!.invalidateSize(), 200);
  }
}
