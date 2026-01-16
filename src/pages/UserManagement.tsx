import { useState } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Eye,
  Building2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const UserManagement = () => {
  // স্ট্যাটিক ইউজার ডেটা
  const users = [
    {
      id: 1,
      name: "আব্দুর রহিম",
      room: "৪০২",
      building: "পদ্মা",
      status: "Active",
      phone: "017XXXXXXXX",
    },
    {
      id: 2,
      name: "করিম উদ্দিন",
      room: "১০৫",
      building: "মেঘনা",
      status: "Restricted",
      phone: "018XXXXXXXX",
    },
    {
      id: 3,
      name: "সাকিব আল হাসান",
      room: "৩০১",
      building: "যমুনা",
      status: "Active",
      phone: "019XXXXXXXX",
    },
    {
      id: 4,
      name: "মাহমুদুল্লাহ",
      room: "২০২",
      building: "পদ্মা",
      status: "Pending",
      phone: "015XXXXXXXX",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-gradient">
            ইউজার ম্যানেজমেন্ট
          </h2>
          <p className="text-sm text-muted-foreground">
            হোস্টেলের সকল আবাসিক মেম্বারদের তালিকা এবং স্ট্যাটাস কন্ট্রোল করুন।
          </p>
        </div>
        <Button className="bg-gradient-hero shadow-glow font-bold">
          + নতুন ইউজার যোগ করুন
        </Button>
      </div>

      {/* Filters & Search - Glass Effect */}
      <div className="glass p-4 rounded-xl flex flex-wrap items-center gap-4 border-border/40">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="নাম বা ফোন নাম্বার দিয়ে খুঁজুন..."
            className="pl-10 bg-background/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" /> বিল্ডিং
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" /> স্ট্যাটাস
          </Button>
        </div>
      </div>

      {/* User Table Section */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  ইউজার
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  বিল্ডিং ও রুম
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  ফোন
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  স্ট্যাটাস
                </th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                  অ্যাকশন
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-linear-to-b from-card to-background/30">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-primary/5 transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-sm group-hover:text-primary transition-colors">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-foreground font-medium">
                        {user.building}
                      </span>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-tighter">
                        রুম নং: {user.room}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {user.phone}
                  </td>
                  <td className="p-4">
                    <Badge
                      className={
                        user.status === "Active"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : user.status === "Restricted"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-accent/10 text-accent border-accent/20"
                      }
                    >
                      {user.status === "Active"
                        ? "সক্রিয়"
                        : user.status === "Restricted"
                        ? "সীমাবদ্ধ"
                        : "পেন্ডিং"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 font-sans"
                      >
                        <DropdownMenuLabel>ইউজার অপশন</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer gap-2">
                          <Eye className="w-4 h-4" /> প্রোফাইল দেখুন
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-2">
                          <Calendar className="w-4 h-4 text-accent" /> ডেডলাইন
                          বাড়ান
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === "Active" ? (
                          <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                            <UserX className="w-4 h-4" /> রেস্ট্রিক্ট করুন
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="cursor-pointer gap-2 text-primary focus:text-primary">
                            <UserCheck className="w-4 h-4" /> অ্যাক্টিভ করুন
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Static */}
        <div className="p-4 border-t border-border bg-secondary/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>মোট {users.length} জন ইউজারের মধ্যে ১-৪ দেখানো হচ্ছে</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-7 text-[10px]"
            >
              পূর্ববর্তী
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px]">
              পরবর্তী
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
