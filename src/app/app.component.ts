import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as Chart from 'chart.js';
import { SystemCpu } from './interface/system-cpu';
import { SystemHealth } from './interface/system-health';
import { DashboardService } from './service/dashboard.service';
import { ChartType } from '../app/enum/chart-type.enum';

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

  public pageSize: number = 10;
  public page: number = 1;


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

  public exportTableToExcel(): void {
    const downloadLink = document.createElement('a');
    const dataType = 'application/vnd.ms-excel';
    const table = document.getElementById('httptrace-table');
    const tableHTML = table.outerHTML.replace(/ /g, '%20');
    const filename = 'httptrace.xls';
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:' + dataType + ', ' + tableHTML;
    downloadLink.download = filename;
    downloadLink.click();
}

  private getTraces(): void {
    this.dashBoardService.getHttpTraces().subscribe(
      (response: any) => {
        this.processTraces(response.traces);
        this.initializeBarChart();
        this.initializePieChart();
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
    this.traceList = traces.filter((trace: { request: { uri: string | string[]; }; }) => {
      return !trace.request.uri.includes('actuator');
    });
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
        if (isUpdateTime) {
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
    const hours = Math.floor(timestamp / 60 / 60);
    const minutes = Math.floor(timestamp / 60) - (hours * 60);
    const seconds = timestamp % 60;
    return hours.toString().padStart(2, '0') + 'h ' +
      minutes.toString().padStart(2, '0') + 'm ' +
      seconds.toString().padStart(2, '0') + 's ';
  }

  private initializeBarChart(): Chart {
    const element = <HTMLCanvasElement>document.getElementById('barChart');
    return new Chart(element, {
      type: ChartType.BAR,
      data: {
        labels: ['200', '404', '400', '500'],
        datasets: [{
          data: [this.http200Traces.length, this.http404Traces.length, this.http400Traces.length, this.http500Traces.length],
          backgroundColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
          borderColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
          borderWidth: 3
        }]
      },
      options: {
        title: { display: true, text: [`Last 100 Requests as of ${this.formatDate(new Date())}`] },
        legend: { display: false },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
  }

  private initializePieChart(): Chart {
    const element = <HTMLCanvasElement>document.getElementById('pieChart');
    return new Chart(element, {
      type: ChartType.PIE,
      data: {
        labels: ['200', '404', '400', '500'],
        datasets: [{
          data: [this.http200Traces.length, this.http404Traces.length, this.http400Traces.length, this.http500Traces.length],
          backgroundColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
          borderColor: ['rgb(40,167,69)', 'rgb(0,123,255)', 'rgb(253,126,20)', 'rgb(220,53,69)'],
          borderWidth: 3
        }]
      },
      options: {
        title: { display: true, text: [`Last 100 Requests as of ${this.formatDate(new Date())}`] },
        legend: { display: true },
      }
    });
  }

  private formatDate(date: Date): string {
    const dd = date.getDate();
    const mm = date.getMonth() + 1;
    const year = date.getFullYear();
    if (dd < 10) {
      const day = `0${dd}`;
    }
    if (mm < 10) {
      const month = `0${mm}`;
    }
    return `${mm}/${dd}/${year}`;
  }


}
