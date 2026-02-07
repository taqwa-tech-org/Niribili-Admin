import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Utensils } from "lucide-react";
import useAxiosSecure from "@/AllHooks/useAxiosSecure";
import UserTransaction from "@/components/dashboard/UserTransaction";

type MealType = "breakfast" | "lunch" | "dinner";

interface MealOrder {
  mealType: MealType;
  quantity: number;
  mealDate: string;
}

const AdminDashboard: React.FC = () => {
  const axiosSecure = useAxiosSecure();

  const [mealCounts, setMealCounts] = useState({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });

  const totalResidents = 124; 

  
  const today = new Date().toISOString().split("T")[0];
  console.log(today)
  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const res = await axiosSecure.get(
          `/meals/admin/orders/date/${today}`
        );
         console.log(res.data)
        const meals: MealOrder[] = res.data.data || [];

        const counts = {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
        };

        meals.forEach((meal) => {
          counts[meal.mealType] += meal.quantity;
        });

        setMealCounts(counts);
      } catch (error) {
        console.error("Meal fetch failed", error);
      }
    };

    fetchMeals();
  }, [axiosSecure, today]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-display text-gradient">
          অ্যাডমিন ওভারভিউ
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl border border-border/50 bg-linear-to-b from-card to-background h-full">
            <h3 className="font-bold flex items-center gap-2 mb-6 text-lg">
              <Utensils className="w-5 h-5 text-accent" />
              আজকের মিল অর্ডার ({today})
            </h3>

            <div className="space-y-5">
              {[
                {
                  label: "সকাল (Breakfast)",
                  count: mealCounts.breakfast,
                  color: "bg-orange-500",
                },
                {
                  label: "দুপুর (Lunch)",
                  count: mealCounts.lunch,
                  color: "bg-primary",
                },
                {
                  label: "রাত (Dinner)",
                  count: mealCounts.dinner,
                  color: "bg-indigo-500",
                },
              ].map((meal, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{meal.label}</span>
                    <span className="text-primary">
                      {meal.count} জন
                    </span>
                  </div>

                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(meal.count / totalResidents) * 100}%`,
                      }}
                      transition={{ duration: 0.8, delay: i * 0.15 }}
                      className={`h-full ${meal.color} shadow-glow`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <UserTransaction/>
    </div>
  );
};

export default AdminDashboard;
