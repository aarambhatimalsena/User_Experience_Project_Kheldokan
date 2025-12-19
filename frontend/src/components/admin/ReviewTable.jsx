import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FaTrash } from "react-icons/fa";
import { deleteReviewByAdmin } from "../../services/reviewService";
import ConfirmModal from "../common/ConfirmModal";

const ReviewTable = ({ reviews }) => {
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { mutate: deleteHandler } = useMutation({
    mutationFn: deleteReviewByAdmin,
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries(["admin-reviews"]);
      setShowConfirm(false);
      setSelectedReview(null);
    },
    onError: () => toast.error("Failed to delete review"),
  });

  const handleDeleteClick = (review) => {
    setSelectedReview({
      productId: review.productId,
      reviewId: review._id,
    });
    setShowConfirm(true);
  };

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      {/* same inner container as OrderTable */}
      <div className="max-h-[500px] overflow-y-auto border rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Comment</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {reviews.map((review) => (
              <tr
                key={review._id}
                className="border-t hover:bg-gray-50 transition"
              >
                {/* Product */}
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">
                    {review.productName || "Unknown product"}
                  </div>
                  {review.productId && (
                    <div className="text-xs text-gray-400">
                      #{String(review.productId).slice(-6)}
                    </div>
                  )}
                </td>

                {/* User */}
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">
                    {review.name || "Anonymous"}
                  </div>
                  {review.email && (
                    <div className="text-xs text-gray-500">
                      {review.email}
                    </div>
                  )}
                </td>

                {/* Rating */}
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="font-semibold">
                      {review.rating}/5
                    </span>
                    <span className="text-yellow-500 text-sm">
                      {"★".repeat(review.rating)}
                    </span>
                  </span>
                </td>

                {/* Comment */}
                <td className="px-4 py-3 align-top">
                  <p className="text-gray-700 text-sm">
                    {review.comment || "No comment"}
                  </p>
                </td>

                {/* Actions (right aligned, like orders) */}
                <td className="px-4 py-3 text-right text-xs sm:text-sm">
                  <button
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 hover:underline"
                    onClick={() => handleDeleteClick(review)}
                  >
                    <FaTrash className="text-xs" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {reviews.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => {
          if (selectedReview) {
            deleteHandler(selectedReview);
          }
        }}
        title="Are you sure?"
        message="Do you really want to delete this review? This action cannot be undone."
      />
    </div>
  );
};

export default ReviewTable;
