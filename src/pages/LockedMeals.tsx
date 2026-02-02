import React, { useEffect, useState, useMemo } from "react";
import { axiosSecure } from "@/AllHooks/useAxiosSecure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Calendar, Users, Utensils, Wallet } from "lucide-react";

interface Order {
  _id: string;
  userId: { _id?: string; name?: string; phone?: string; email?: string } | any;
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

interface UserMealSummary {
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  building: string;
  flat: string;
  breakfast: { qty: number; price: number };
  lunch: { qty: number; price: number };
  dinner: { qty: number; price: number };
  totalQty: number;
  totalPrice: number;
  isPaid: boolean;
}

const LockedMeals: React.FC = () => {

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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
    }
  }, [selectedDate]);

  // Group orders by user - one row per user with all meals
  const userMealSummaries = useMemo((): UserMealSummary[] => {
    if (!data?.orders) return [];
    
    const userMap = new Map<string, UserMealSummary>();
    
    data.orders.forEach((order: Order) => {
      const oderId = order.userId?._id || order.userId;
      const existing = userMap.get(oderId);
      
      if (existing) {
        // Update existing user entry
        if (order.mealType === 'breakfast') {
          existing.breakfast.qty += order.quantity || 0;
          existing.breakfast.price += order.totalPrice || 0;
        } else if (order.mealType === 'lunch') {
          existing.lunch.qty += order.quantity || 0;
          existing.lunch.price += order.totalPrice || 0;
        } else if (order.mealType === 'dinner') {
          existing.dinner.qty += order.quantity || 0;
          existing.dinner.price += order.totalPrice || 0;
        }
        existing.totalQty += order.quantity || 0;
        existing.totalPrice += order.totalPrice || 0;
      } else {
        // Create new user entry
        const newEntry: UserMealSummary = {
          userId: oderId,
          userName: order.userId?.name || '-',
          userPhone: order.userId?.phone || '-',
          userEmail: order.userId?.email || '-',
          building: order.buildingId?.name || '-',
          flat: order.flatId?.name || '-',
          breakfast: { qty: 0, price: 0 },
          lunch: { qty: 0, price: 0 },
          dinner: { qty: 0, price: 0 },
          totalQty: order.quantity || 0,
          totalPrice: order.totalPrice || 0,
          isPaid: order.isPaid || false,
        };
        
        if (order.mealType === 'breakfast') {
          newEntry.breakfast.qty = order.quantity || 0;
          newEntry.breakfast.price = order.totalPrice || 0;
        } else if (order.mealType === 'lunch') {
          newEntry.lunch.qty = order.quantity || 0;
          newEntry.lunch.price = order.totalPrice || 0;
        } else if (order.mealType === 'dinner') {
          newEntry.dinner.qty = order.quantity || 0;
          newEntry.dinner.price = order.totalPrice || 0;
        }
        
        userMap.set(oderId, newEntry);
      }
    });
    
    return Array.from(userMap.values());
  }, [data]);



  

 

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
              <Button className="flex-1 sm:flex-none">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">মোট ইউজার</div>
                  <div className="text-2xl font-bold text-blue-600">{userMealSummaries.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">মোট অর্ডার</div>
                  <div className="text-2xl font-bold text-green-600">{data.totalOrders ?? 0}</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Utensils className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">মোট মিল</div>
                  <div className="text-2xl font-bold text-orange-600">{data.totalMeals ?? 0}</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">সর্বমোট টাকা</div>
                  <div className="text-2xl font-bold text-purple-600">৳{data.grandTotal ?? 0}</div>
                </div>
              </div>
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

          {/* User Meal Summary Table - One user per row */}
          <div>
            <h3 className="text-xl font-semibold mb-4">📋 ইউজার ভিত্তিক মিল (User Wise Meals)</h3>
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Phone</th>
                      <th className="text-left p-3 font-medium">Building</th>
                      <th className="text-left p-3 font-medium">Flat</th>
                      <th className="text-center p-3 font-medium">🌅 Breakfast</th>
                      <th className="text-center p-3 font-medium">🍛 Lunch</th>
                      <th className="text-center p-3 font-medium">🌙 Dinner</th>
                      <th className="text-center p-3 font-medium">Total Qty</th>
                      <th className="text-right p-3 font-medium">Total Price</th>
                      <th className="text-center p-3 font-medium">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userMealSummaries.map((user, idx) => (
                      <tr key={user.userId} className={`${idx % 2 === 0 ? 'bg-muted/20' : ''} hover:bg-muted/40 transition-colors`}>
                        <td className="p-3">
                          <p className="font-medium">{user.userName}</p>
                          <p className="text-xs text-muted-foreground">{user.userEmail}</p>
                        </td>
                        <td className="p-3">{user.userPhone}</td>
                        <td className="p-3">{user.building}</td>
                        <td className="p-3">{user.flat}</td>
                        <td className="p-3 text-center">
                          {user.breakfast.qty > 0 ? (
                            <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded">
                              <span className="font-semibold">{user.breakfast.qty}</span>
                              <span className="text-xs ml-1">(৳{user.breakfast.price})</span>
                            </div>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="p-3 text-center">
                          {user.lunch.qty > 0 ? (
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded">
                              <span className="font-semibold">{user.lunch.qty}</span>
                              <span className="text-xs ml-1">(৳{user.lunch.price})</span>
                            </div>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="p-3 text-center">
                          {user.dinner.qty > 0 ? (
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded">
                              <span className="font-semibold">{user.dinner.qty}</span>
                              <span className="text-xs ml-1">(৳{user.dinner.price})</span>
                            </div>
                          ) : <span className="text-muted-foreground">-</span>}
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-semibold">
                            {user.totalQty}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-primary">৳{user.totalPrice}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${user.isPaid ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                            {user.isPaid ? '✓ Paid' : '✗ Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Table Footer with Totals */}
                  <tfoot className="bg-muted/50 font-semibold">
                    <tr>
                      <td colSpan={4} className="p-3 text-right">Total:</td>
                      <td className="p-3 text-center">
                        <span className="bg-orange-200 dark:bg-orange-900/50 px-2 py-1 rounded">
                          {userMealSummaries.reduce((sum, u) => sum + u.breakfast.qty, 0)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-green-200 dark:bg-green-900/50 px-2 py-1 rounded">
                          {userMealSummaries.reduce((sum, u) => sum + u.lunch.qty, 0)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-indigo-200 dark:bg-indigo-900/50 px-2 py-1 rounded">
                          {userMealSummaries.reduce((sum, u) => sum + u.dinner.qty, 0)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                          {data.totalMeals ?? 0}
                        </span>
                      </td>
                      <td className="p-3 text-right text-primary">৳{data.grandTotal ?? 0}</td>
                      <td></td>
                    </tr>
                  </tfoot>
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
