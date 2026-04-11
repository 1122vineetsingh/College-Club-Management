import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileDown, FileText, FileSpreadsheet, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalClubs: number;
  activeEvents: number; 
  totalMembers: number;
  pendingRequests: number;
}

export default function Reports() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("club-membership");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState("pdf");
  // API base handled by apiRequest
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const handleGenerateReport = () => {
    if (!reportType) {
      toast({
        title: "Error",
        description: "Please select a report type",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Report Generated",
      description: `${reportType} report is being generated in ${format.toUpperCase()} format`,
    });
  };

  const quickStats = [
    { label: "Total Active Clubs", value: stats?.totalClubs || 0 },
    { label: "Total Members", value: stats?.totalMembers || 0 },
    { label: "Events This Month", value: stats?.activeEvents || 0 },
    { label: "Average Attendance", value: "85%" },
  ];

  const recentReports = [
    {
      id: "1",
      name: "Club Membership Report - October 2024",
      date: "Oct 28, 2024",
      type: "pdf",
    },
    {
      id: "2", 
      name: "Event Participation Data - Q3 2024",
      date: "Oct 25, 2024",
      type: "csv",
    },
    {
      id: "3",
      name: "Club Activities Summary - September 2024",
      date: "Oct 01, 2024",
      type: "pdf",
    },
  ];

  const handleDownloadReport = (reportId: string, reportName: string) => {
    toast({
      title: "Download Started",
      description: `Downloading ${reportName}`,
    });
  };

  const handleDeleteReport = (reportId: string, reportName: string) => {
    toast({
      title: "Report Deleted",
      description: `${reportName} has been deleted`,
    });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-2">Generate and download comprehensive reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Report Generation */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="report-type">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" data-testid="select-report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="club-membership">Club Membership Report</SelectItem>
                  <SelectItem value="event-participation">Event Participation Report</SelectItem>
                  <SelectItem value="club-activities">Club Activities Report</SelectItem>
                  <SelectItem value="financial-summary">Financial Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  data-testid="input-date-from"
                />
                <Input 
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  data-testid="input-date-to"
                />
              </div>
            </div>

            <div>
              <Label>Format</Label>
              <RadioGroup value={format} onValueChange={setFormat} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" data-testid="radio-pdf" />
                  <Label htmlFor="pdf">PDF</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" data-testid="radio-csv" />
                  <Label htmlFor="csv">CSV</Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              onClick={handleGenerateReport} 
              className="w-full"
              data-testid="button-generate-report"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickStats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="flex justify-between items-center p-3 bg-muted rounded"
                data-testid={`stat-${index}`}
              >
                <span className="text-foreground">{stat.label}</span>
                <span className="font-bold text-foreground" data-testid={`stat-value-${index}`}>
                  {stat.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {recentReports.map((report) => (
              <div 
                key={report.id} 
                className="py-4 flex items-center justify-between"
                data-testid={`report-${report.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded ${
                    report.type === 'pdf' ? 'bg-red-500' : 'bg-green-600'
                  }`}>
                    {report.type === 'pdf' ? (
                      <FileText className="text-white h-5 w-5" />
                    ) : (
                      <FileSpreadsheet className="text-white h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground" data-testid={`report-name-${report.id}`}>
                      {report.name}
                    </h4>
                    <p className="text-sm text-muted-foreground" data-testid={`report-date-${report.id}`}>
                      Generated on {report.date}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadReport(report.id, report.name)}
                    data-testid={`button-download-${report.id}`}
                  >
                    <FileDown className="mr-1 h-4 w-4" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteReport(report.id, report.name)}
                    data-testid={`button-delete-${report.id}`}
                  >
                    <Trash2 className="mr-1 h-4 w-4 text-destructive" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
