import React, { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import InputModal from "../../components/modal/InputModal";
import ConfirmModal from "../../components/modal/ConfirmModal";
import {
  getWorkingScholars,
  createWorkingScholar,
  updateWorkingScholar,
  deleteWorkingScholar,
} from "../../api/staff";
import { toast } from "sonner";
export default function ManageAccount() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [showBackConfirmModal, setShowBackConfirmModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setFetchLoading(true);
      console.log("🔄 Fetching working scholars...");

      const result = await getWorkingScholars();

      console.log("✅ Accounts fetched:", result.data);

      const transformedAccounts = result.data.map((scholar) => ({
        id: scholar.sasStaffId,
        sasStaffId: scholar.sasStaffId,
        username: scholar.username,
        fullName: scholar.name,
        firstName: scholar.firstName,
        lastName: scholar.lastName,
        role: "Working Scholar",
        email: scholar.email,
      }));

      setAccounts(transformedAccounts);
    } catch (error) {
      console.error("❌ Error fetching accounts:", error);
      toast.error(error.response?.data?.message || "Failed to fetch accounts");
    } finally {
      setFetchLoading(false);
    }
  };

  const capitalizeWords = (string) => {
    if (!string) return string;
    return string
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const filteredAccounts = accounts.filter(
    (account) =>
      account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (account) => {
    setSelectedAccount({
      sasStaffId: account.sasStaffId,
      firstName: account.firstName,
      lastName: account.lastName,
      username: account.username,
      email: account.email,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddAccount = () => {
    setSelectedAccount({
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      setLoading(true);
      console.log("💾 Saving account...", formData);

      if (isEditMode) {
        // Update existing account
        const updateData = {
          username: formData.username,
          firstName: capitalizeWords(formData.firstName),
          lastName: capitalizeWords(formData.lastName),
          email: formData.email,
        };

        // Only include password if provided
        if (formData.newPassword) {
          updateData.newPassword = formData.newPassword;
          updateData.confirmPassword = formData.confirmPassword;
        }

        console.log(
          "📤 Updating account:",
          selectedAccount.sasStaffId,
          updateData
        );

        const result = await updateWorkingScholar(
          selectedAccount.sasStaffId,
          updateData
        );

        console.log("✅ Account updated:", result);
        toast.success(result.message || "Account updated successfully");
      } else {
        // Create new account
        const createData = {
          username: formData.username,
          firstName: capitalizeWords(formData.firstName),
          lastName: capitalizeWords(formData.lastName),
          email: formData.email,
          password: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        };

        console.log("📤 Creating account:", createData);

        const result = await createWorkingScholar(createData);

        console.log("✅ Account created:", result);
        toast.success(result.message || "Account created successfully");
      }

      // Refresh accounts list
      await fetchAccounts();

      // Close modal
      setIsModalOpen(false);
      return true; // Success
    } catch (error) {
      console.error("❌ Error saving account:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save account";
      toast.error(errorMessage);
      return false; // Validation failed, keep modal open
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (account) => {
    try {
      setLoading(true);
      console.log("🗑️ Deleting account:", account.sasStaffId);

      const result = await deleteWorkingScholar(account.sasStaffId);

      console.log("✅ Account deleted:", result);
      toast.success(result.message || "Account deleted successfully");

      // Refresh accounts list
      await fetchAccounts();
    } catch (error) {
      console.error("❌ Error deleting account:", error);
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setLoading(false);
      setShowBackConfirmModal(false);
      setAccountToDelete(null);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-9 flex lg:w-[100%]">
      <div className="flex flex-col min-h-[90vh] w-full justify-between pb-15 xl:pb-0 pr-8 pt-6 xl:pt-9 md:px-8 md:pl-15 xl:pl-9">
        {/* Header */}
        <div className="sm:flex flex items-start justify-between mb-7">
          <div>
            <h1 className="text-3xl font-semibold text-left text-[#202124]">
              Manage Accounts
            </h1>
            <p className="text-left text-[#686969]">
              Personnel account management
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center justify-end">
            <button
              onClick={handleAddAccount}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3.5 bg-[#1A73E8] text-white rounded-xl sm:rounded-2xl hover:bg-blue-700 transition font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
            >
              <div className="inline-block w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0">
                <img
                  src="/assets/manage_acc/add.png"
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="whitespace-nowrap">Add Account</span>
            </button>
          </div>
        </div>

        {/* Personnel Accounts Card */}
        <div className="bg-white rounded-2xl shadow-xs p-6 flex-6 overflow-y-scroll scrollbar-thumb-blue-500 scrollbar-custom max-h-[80vh]">
          {/* Card Header */}
          <div className="sm:flex items-center justify-between mb-6 sticky">
            <h2 className="text-xl text-left font-medium text-[#202124]">
              Personnel Accounts
            </h2>

            {/* Search Bar */}
            <div className="relative w-80 mt-5">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full text-left">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969]">
                    Username
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969]">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969]">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969]">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr
                    key={account.sasStaffId}
                    className="border-b text-left border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="py-4 px-4 text-[#202124] text-left">
                      {account.username}
                    </td>
                    <td className="py-4 px-4 text-[#202124] text-left">
                      {account.fullName}
                    </td>
                    <td className="py-4 px-4 text-[#202124] text-left">
                      {account.role}
                    </td>
                    <td className="py-4 px-4 text-[#202124] text-left">
                      {account.email}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-start gap-2">
                        <button
                          onClick={() => handleEdit(account)}
                          disabled={loading}
                          className="p-2 bg-[#26BA33]/20 text-green-600 rounded-lg hover:bg-green-200 transition cursor-pointer disabled:opacity-50"
                        >
                          <div className="">
                            <img src="/assets/manage_acc/update.png" alt="" />
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            setAccountToDelete(account);
                            setShowBackConfirmModal(true);
                          }}
                          disabled={loading}
                          className="p-2 bg-[#EA4335]/20 text-red-600 rounded-lg hover:bg-red-200 transition cursor-pointer disabled:opacity-50"
                        >
                          <div className="">
                            <img src="/assets/manage_acc/trashcan.png" alt="" />
                          </div>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* No Results */}
            {filteredAccounts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No accounts found matching your search.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Input Modal */}
        <InputModal
          title={isEditMode ? "Update Account" : "Add Account"}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          accountData={selectedAccount}
          onSave={handleSave}
          submitType={isEditMode ? "Update Account" : "Add Account"}
          details={
            isEditMode ? "Edit account details for" : "Add a new account for"
          }
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showBackConfirmModal}
          onClose={() => setShowBackConfirmModal(false)}
          onConfirm={() => {
            if (accountToDelete) {
              handleDelete(accountToDelete);
            }
          }}
          loading={loading}
          icon="/assets/manage_acc/caution.png"
          iconAlt="Warning"
          iconSize="w-12 h-12"
          showLoading={true}
          title="Delete Account"
          cancelText="Cancel"
          confirmText="Remove"
          showCloseButton={false}
          hideActions={false}
          cancelButtonClass="px-4 py-3 bg-[#E2E3E4] text-black hover:bg-[#c6c7c8] rounded-xl w-1/2 font-medium cursor-pointer"
          confirmButtonClass="px-4 py-3 bg-[#EA4335] text-white hover:bg-red-700 rounded-xl w-1/2 font-medium cursor-pointer"
          description={
            <>
              Are you sure you want to delete this account?
              <br />
              This action can't be undone.
            </>
          }
        />
      </div>
    </div>
  );
}
