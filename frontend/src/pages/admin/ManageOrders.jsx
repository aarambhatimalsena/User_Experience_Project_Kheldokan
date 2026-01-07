import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllOrders } from "../../services/orderService";
import toast from "react-hot-toast";
import OrderTable from "../../components/admin/OrderTable";
import HeaderBox from "../../components/common/HeaderBox";
import { FaClipboardList } from "react-icons/fa";

const ManageOrders = () => {
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: getAllOrders,
    onError: () => toast.error("Failed to load orders"),
  });

  return (
    <div className="bg-[#fffcee] min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* ✅ Beautiful Header with Icon */}
        <HeaderBox
          icon={<FaClipboardList className="text-blue-600" />}
          title="Manage Orders"
          subtitle="Track, manage and fulfill customer orders from here."
        />

        {/* ✅ Order Table Section */}
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          {isLoading ? (
            <p className="text-gray-500">Loading orders...</p>
          ) : isError ? (
            <p className="text-red-500">Something went wrong</p>
          ) : (
            <OrderTable orders={orders} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageOrders;
