import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AgentService {
  private flaskApiUrl = 'http://localhost:5000/api/agent';

  constructor(private http: HttpClient) { }

  /**
   * Triggers the AI model retraining process in the Flask agent.
   */
  retrainModel(): Observable<any> {
    return this.http.post(`${this.flaskApiUrl}/retrain`, {});
  }

  /**
   * Calls the prediction API.
   */
  predict(data: any): Observable<any> {
    return this.http.post(`${this.flaskApiUrl}/predict`, data);
  }
}
