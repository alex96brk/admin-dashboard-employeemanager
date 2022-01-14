import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { SystemCpu } from './interface/system-cpu';
import { SystemHealth } from './interface/system-health';
import { DashboardService } from './service/dashboard.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public traceList: any[] = [];
  public selectedTrace: any;
  public systemHealth: SystemHealth;
  public systemCpu: SystemCpu;
  public processUptime: string;
  public timestamp: number;
  public http200Traces: any[] = [];
  public http400Traces: any[] = [];
  public http404Traces: any[] = [];
  public http500Traces: any[] = [];
  public httpDefaultTraces: any[] = [];


  constructor(private dashBoardService: DashboardService) { }

  ngOnInit(): void {
    this.getTraces();
    this.getCpuUsage();
    this.getSystemHealth();
    this.getProcessUpTime(true);
  }

  public onSelectTrace(trace: any): void {
    this.selectedTrace = trace;
    document.getElementById('trace-modal')?.click();
  }

  public onRefreshData(): void {
    this.http200Traces = [];
    this.http400Traces = [];
    this.http404Traces = [];
    this.http500Traces = [];
    this.httpDefaultTraces = [];
    this.getTraces();
    this.getCpuUsage();
    this.getSystemHealth();
    this.getProcessUpTime(false);

  }

  private getTraces(): void {
    this.dashBoardService.getHttpTraces().subscribe(
      (response: any) => {
        this.processTraces(response.traces);
      },

      (error: HttpErrorResponse) => {
        alert(error.message);
      }
    );
  }

  private getCpuUsage(): void {
    this.dashBoardService.getSystemCpu().subscribe(
      (response: SystemCpu) => {
        this.systemCpu = response;
      },

      (error: HttpErrorResponse) => {
        alert(error.message);
      }
    );
  }

  private getSystemHealth(): void {
    this.dashBoardService.getSystemHealth().subscribe(
      (response: SystemHealth) => {
        this.systemHealth = response;
        this.systemHealth.components.diskSpace.details.free = this.formatBytes(this.systemHealth.components.diskSpace.details.free);
      },

      (error: HttpErrorResponse) => {
        alert(error.message);
      }
    );
  }

  private processTraces(traces: any): void {
    this.traceList = traces;
    this.traceList.forEach(trace => {
      switch (trace.response.status) {
        case 200:
          this.http200Traces.push(trace);
          break;
        case 400:
          this.http400Traces.push(trace);
          break;
        case 404:
          this.http404Traces.push(trace);
          break;
        case 500:
          this.http500Traces.push(trace);
          break;
        default:
          this.httpDefaultTraces.push(trace);
      }
    });
  }

  private getProcessUpTime(isUpdateTime: boolean): void {
    this.dashBoardService.getProcessUptime().subscribe(
      (response: any) => {
        this.timestamp = Math.round(response.measurements[0].value);
        this.processUptime = this.formatUptime(this.timestamp);
        if(isUpdateTime) {
          this.updateTimer();
        }
      },

      (error: HttpErrorResponse) => {
        alert(error.message);
      }
    );
  }
  private updateTimer(): void {
    setInterval(() => {
      this.processUptime = this.formatUptime(this.timestamp + 1);
      this.timestamp++;
    }, 1000);
  }

  private formatBytes(bytes: any): string {
    if (bytes === 0) {
       return '0 Bytes';
      }
    const k = 1024;
    const dm = 2 < 0 ? 0 : 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i))
                                    .toFixed(dm)) + ' ' + sizes[i];
}

private formatUptime(timestamp: number): string {
  const hours = Math.floor(timestamp / 60  / 60);
  const minutes = Math.floor(timestamp /60) - (hours * 60);
  const seconds = timestamp % 60;
  return hours.toString().padStart(2, '0') + 'h ' +
         minutes.toString().padStart(2, '0') + 'm ' +
         seconds.toString().padStart(2, '0') + 's ';
}


}
