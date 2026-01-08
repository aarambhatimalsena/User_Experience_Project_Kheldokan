import React, { useEffect, useMemo, useState, startTransition } from "react";
import { FiEye, FiEyeOff, FiHome } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  deleteProfileImage, // ✅ already exists in your service
} from "../../services/userService";
import toast from "react-hot-toast";

const UserProfile = () => {
  const { user, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // ✅ modal for full view
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // ✅ Error Prevention: confirm modal state (added)
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  const busy = saving || uploadingImage;

  // ✅ stable image to show
  const displayImage = useMemo(() => {
    return previewImage || user?.profileImage || "/default-avatar.png";
  }, [previewImage, user?.profileImage]);

  // ===== LOAD PROFILE ONCE =====
  useEffect(() => {
    let alive = true;

    const fetchProfile = async () => {
      try {
        const data = await getUserProfile();
        if (!alive) return;

        setFormData({
          name: data.name || "",
          email: data.email || "",
          password: "",
          confirmPassword: "",
        });

        updateUser(data);
      } catch (err) {
        toast.error("❌ Failed to load profile");
      } finally {
        if (alive) setProfileLoaded(true);
      }
    };

    fetchProfile();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ cleanup blob URL
  useEffect(() => {
    return () => {
      if (previewImage?.startsWith("blob:")) URL.revokeObjectURL(previewImage);
    };
  }, [previewImage]);

  // ✅ ESC closes modal
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsImageModalOpen(false);
    };
    if (isImageModalOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isImageModalOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ View full photo
  const handleViewPhoto = () => setIsImageModalOpen(true);

  // ✅ Remove photo permanently (backend)
  const handleRemovePhoto = async () => {
    setUploadingImage(true);
    try {
      const data = await deleteProfileImage(); // backend returns profileImage: ''
      updateUser(data);
      setPreviewImage(null);

      window.dispatchEvent(new Event("update-profile"));
      toast.success("✅ Profile photo removed!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "❌ Failed to remove photo");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validation
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    // ✅ instant preview (smooth feel)
    const tempUrl = URL.createObjectURL(file);
    startTransition(() => {
      setPreviewImage(tempUrl);
    });

    const imgForm = new FormData();
    imgForm.append("image", file);

    setUploadingImage(true);
    try {
      const result = await uploadProfileImage(imgForm);
      updateUser({ ...user, profileImage: result.profileImage });

      window.dispatchEvent(new Event("update-profile"));
      toast.success("✅ Profile image updated!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "❌ Image upload failed");
      setPreviewImage(null);
    } finally {
      setUploadingImage(false);
      // allow re-select same file
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ===== PASSWORD VALIDATION =====
    if (formData.password || formData.confirmPassword) {
      if (!formData.password || !formData.confirmPassword) {
        toast.error("Please enter and confirm your new password.");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error("New password and confirm password do not match.");
        return;
      }

      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
    }

    setSaving(true);

    try {
      const payload = { name: formData.name, email: formData.email };
      if (formData.password) payload.password = formData.password;

      const updatedUser = await updateUserProfile(payload);
      updateUser(updatedUser);

      toast.success("✅ Profile updated successfully!");
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "❌ Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      confirmPassword: "",
    });
    setPreviewImage(null);
  };

  return (
    <>
      {/* ✅ FULLSCREEN IMAGE MODAL */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-6 right-6 text-white text-2xl"
          >
            ✕
          </button>

          <img
            src={displayImage}
            alt="Profile Full"
            className="max-w-[92%] max-h-[92%] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ✅ Error Prevention: Confirm Remove Photo Modal (added) */}
      {isRemoveConfirmOpen && (
        <div
          className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsRemoveConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                Remove profile photo?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                This will remove your current profile photo. You can upload a new one later.
              </p>
            </div>

            <div className="px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-full text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setIsRemoveConfirmOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>

              <button
                type="button"
                className="px-5 py-2 rounded-full text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                onClick={async () => {
                  setIsRemoveConfirmOpen(false);
                  await handleRemovePhoto();
                }}
                disabled={busy}
              >
                Yes, remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧭 Breadcrumb */}
      <div className="bg-[#f5f1eb] py-4 px-6 text-sm text-gray-700 border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FiHome className="inline-block w-4 h-4" />
            <Link to="/" className="hover:underline hover:text-gray-800">
              Home
            </Link>
            <span className="text-gray-400">/</span>
            <span className="font-semibold text-gray-900">My Account</span>
          </div>
          {user?.name && (
            <p className="text-xs text-gray-500">
              Welcome,&nbsp;
              <span className="font-semibold text-gray-800">{user.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Page background */}
      <div className="bg-[#faf7f2]">
        <div className="max-w-6xl mx-auto px-4 lg:px-0 py-10 flex flex-col md:flex-row gap-10">
          {/* LEFT SIDEBAR */}
          <aside className="w-full md:w-64">
            <div className="bg-white/80 border border-gray-200 rounded-2xl px-5 py-6 shadow-sm">
              <div className="mb-6">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-3">
                  Manage My Account
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <span className="inline-flex items-center rounded-full px-3 py-1 bg-gray-900 text-white text-xs font-semibold uppercase tracking-[0.16em]">
                      My Profile
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-3">
                  My Orders
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/orders" className="text-gray-600 hover:text-gray-900">
                      My Orders
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 mb-3">
                  My Wishlist
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/wishlist" className="text-gray-600 hover:text-gray-900">
                      View Wishlist
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          {/* RIGHT CONTENT */}
          <section className="flex-1">
            <div className="bg-white border border-gray-200 rounded-[22px] px-6 md:px-10 py-8 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-1">
                    Account
                  </p>
                  <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">
                    Edit Your Profile
                  </h1>
                  <p className="text-xs text-gray-500">
                    Manage your personal details and update your password.
                  </p>
                  {user?.email && (
                    <p className="mt-1 text-xs text-gray-400">
                      Signed in as{" "}
                      <span className="font-medium text-gray-700">{user.email}</span>
                    </p>
                  )}
                </div>

                {/* Avatar + actions */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleViewPhoto}
                      className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm cursor-zoom-in"
                      title="View profile photo"
                      disabled={busy}
                    >
                      <img
                        src={displayImage}
                        alt="Profile"
                        className={`w-full h-full object-cover transition ${
                          uploadingImage ? "opacity-60 blur-[0.5px]" : "opacity-100"
                        }`}
                      />
                    </button>

                    {uploadingImage && (
                      <div className="absolute inset-0 rounded-full flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleViewPhoto}
                      disabled={busy}
                      className={`text-xs md:text-sm border border-gray-300 px-4 py-2 rounded-full transition ${
                        busy ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      View Photo
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRemoveConfirmOpen(true)}
                      disabled={busy}
                      className={`text-xs md:text-sm border border-red-300 text-red-600 px-4 py-2 rounded-full transition ${
                        busy ? "opacity-60 cursor-not-allowed" : "hover:bg-red-50"
                      }`}
                    >
                      Remove
                    </button>

                    <label
                      className={`cursor-pointer text-xs md:text-sm bg-gray-900 text-white px-4 py-2 rounded-full transition ${
                        busy ? "opacity-60 cursor-not-allowed" : "hover:bg-black"
                      }`}
                    >
                      {uploadingImage ? "Uploading..." : "Change Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={busy}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Form */}
              {!profileLoaded ? (
                <p className="text-sm text-gray-500">Loading profile...</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-10">
                  {/* BASIC INFO */}
                  <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-gray-900">
                      Personal Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1 uppercase tracking-[0.18em]">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          required
                          disabled={saving}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1 uppercase tracking-[0.18em]">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          required
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div className="space-y-4 border-t border-gray-100 pt-6">
                    <h2 className="text-sm font-semibold text-gray-900">
                      Password
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                      <div className="relative">
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1 uppercase tracking-[0.18em]">
                          New Password
                        </label>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Leave blank to keep current password"
                          className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          disabled={saving}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-3 top-9 text-gray-500 hover:text-gray-800"
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>

                      <div className="relative">
                        <label className="block text-[11px] font-semibold text-gray-700 mb-1 uppercase tracking-[0.18em]">
                          Confirm New Password
                        </label>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Re-enter new password"
                          className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          disabled={saving}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-3 top-9 text-gray-500 hover:text-gray-800"
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={busy}
                      className="px-6 py-2.5 rounded-full border border-gray-300 bg-white text-xs font-semibold uppercase tracking-[0.18em] text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="px-7 py-2.5 rounded-full bg-[#111827] text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-black disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
