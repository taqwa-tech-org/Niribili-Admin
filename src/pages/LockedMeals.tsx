import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { axiosSecure } from "@/AllHooks/useAxiosSecure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Calendar } from "lucide-react";

interface Order {
  _id: string;
  userId: { name?: string; phone?: string; email?: string } | any;
  buildingId?: { name?: string } | any;
  flatId?: { name?: string } | any;
  mealDate?: string;
  mealType?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  status?: string;
  isLocked?: boolean;
  isPaid?: boolean;
  createdAt?: string;
}

const LockedMeals: React.FC = () => {
  const { date: urlDate } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(urlDate || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchData = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosSecure.get(`/meals/admin/locked-meals/${date}`);
      setData(res.data.data || res.data);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchData(selectedDate);
      navigate(`/meals/admin/locked-meals/${selectedDate}`, { replace: true });
    }
  }, [selectedDate]);

  const downloadJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `locked-meals-${selectedDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ordersToCSV = (orders: Order[]) => {
    if (!orders || orders.length === 0) return "";
    const headers = [
      "_id",
      "mealDate",
      "mealType",
      "userName",
      "userPhone",
      "userEmail",
      "building",
      "flat",
      "quantity",
      "unitPrice",
      "totalPrice",
      "status",
      "isPaid",
      "createdAt",
    ];
    const lines = [headers.join(",")];
    orders.forEach((o) => {
      const row = [
        o._id,
        o.mealDate || "",
        o.mealType || "",
        (o.userId && o.userId.name) || "",
        (o.userId && o.userId.phone) || "",
        (o.userId && o.userId.email) || "",
        (o.buildingId && o.buildingId.name) || "",
        (o.flatId && o.flatId.name) || "",
        String(o.quantity ?? ""),
        String(o.unitPrice ?? ""),
        String(o.totalPrice ?? ""),
        o.status || "",
        String(o.isPaid ?? ""),
        o.createdAt || "",
      ];
      lines.push(
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      );
    });
    return lines.join("\n");
  };

  const downloadCSV = () => {
    if (!data) return;
    const csv = ordersToCSV(data.orders || []);
    if (!csv) return;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `locked-meals-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header with Date Picker */}
      <div className="bg-card rounded-lg shadow-sm border p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gradient mb-1">লক করা মিল রিপোর্ট</h1>
            <p className="text-sm text-muted-foreground">Locked Meals Report</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10 w-full sm:w-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadCSV} disabled={!data} className="flex-1 sm:flex-none">
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button onClick={downloadJSON} disabled={!data} variant="outline" className="flex-1 sm:flex-none">
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Data Display */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6">
              <div className="text-sm font-medium text-muted-foreground mb-1">মোট অর্ডার</div>
              <div className="text-3xl font-bold text-blue-600">{data.totalOrders ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Orders</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-6">
              <div className="text-sm font-medium text-muted-foreground mb-1">মোট মিল</div>
              <div className="text-3xl font-bold text-green-600">{data.totalMeals ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Meals</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
              <div className="text-sm font-medium text-muted-foreground mb-1">সর্বমোট টাকা</div>
              <div className="text-3xl font-bold text-purple-600">৳{data.grandTotal ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Grand Total</div>
            </div>
          </div>

          {/* Meal Type Summary */}
          <div>
            <h3 className="text-xl font-semibold mb-4">মিলের সামারি (Meal Summary)</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {data.summary &&
                Object.entries(data.summary).map(([mealType, info]: any) => (
                  <div key={mealType} className="bg-card border rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold capitalize text-lg">
                          {mealType === 'breakfast' ? '🌅 সকালের নাস্তা' : 
                           mealType === 'lunch' ? '🍛 দুপুরের খাবার' : 
                           '🌙 রাতের খাবার'}
                        </h4>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Qty: <strong>{info.totalQuantity}</strong></span>
                        <span>•</span>
                        <span>Price: <strong>৳{info.totalPrice}</strong></span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">User</th>
                            <th className="text-left p-3 font-medium">Flat</th>
                            <th className="text-center p-3 font-medium">Qty</th>
                            <th className="text-right p-3 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {info.orders.map((o: Order, idx: number) => (
                            <tr key={o._id} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                              <td className="p-3">{o.userId?.name || "-"}</td>
                              <td className="p-3">{o.flatId?.name || "-"}</td>
                              <td className="p-3 text-center font-semibold">{o.quantity}</td>
                              <td className="p-3 text-right font-semibold">৳{o.totalPrice}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* All Orders Table */}
          <div>
            <h3 className="text-xl font-semibold mb-4">সব অর্ডার (All Orders)</h3>
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Meal Type</th>
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Phone</th>
                      <th className="text-left p-3 font-medium">Building</th>
                      <th className="text-left p-3 font-medium">Flat</th>
                      <th className="text-center p-3 font-medium">Qty</th>
                      <th className="text-right p-3 font-medium">Unit Price</th>
                      <th className="text-right p-3 font-medium">Total</th>
                      <th className="text-center p-3 font-medium">Status</th>
                      <th className="text-center p-3 font-medium">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders && data.orders.map((o: Order, idx: number) => (
                      <tr key={o._id} className={`${idx % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/40 transition-colors`}>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize
                            ${o.mealType === 'breakfast' ? 'bg-orange-100 text-orange-700' : 
                              o.mealType === 'lunch' ? 'bg-green-100 text-green-700' : 
                              'bg-blue-100 text-blue-700'}">
                            {o.mealType}
                          </span>
                        </td>
                        <td className="p-3 font-medium">{o.userId?.name || "-"}</td>
                        <td className="p-3">{o.userId?.phone || "-"}</td>
                        <td className="p-3">{o.buildingId?.name || "-"}</td>
                        <td className="p-3">{o.flatId?.name || "-"}</td>
                        <td className="p-3 text-center font-semibold">{o.quantity}</td>
                        <td className="p-3 text-right">৳{o.unitPrice}</td>
                        <td className="p-3 text-right font-semibold text-primary">৳{o.totalPrice}</td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${o.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">
                            {o.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${o.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {o.isPaid ? '✓ Paid' : '✗ Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LockedMeals;
