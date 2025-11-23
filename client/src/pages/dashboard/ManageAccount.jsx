import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  createWorkingScholar,
  deleteWorkingScholar,
  getWorkingScholars,
  updateWorkingScholar,
} from "../../api/staff";
import { InlineLoading } from "../../components/InLineLoader";
import ConfirmModal from "../../components/modal/ConfirmModal";
import InputModal from "../../components/modal/InputModal";
import { showToast } from "../../components/toast/ShowToast";

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
  const [tableLoading, setTableLoading] = useState(false); // New state for table operations

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
      setTableLoading(true); // Start table loading
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

        console.log("Account updated:", result);
        showToast(result.message || "Account updated successfully", "success");
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
        showToast("Account created successfully", "success");
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
      const errorField = error.response?.data?.field || null;

      showToast(errorMessage, "error");

      return {
        success: false,
        field: errorField,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
      setTableLoading(false); // Stop table loading
    }
  };

  const handleDelete = async (account) => {
    try {
      setLoading(true);
      setTableLoading(true); // Start table loading
      console.log("🗑️ Deleting account:", account.sasStaffId);

      const result = await deleteWorkingScholar(account.sasStaffId);

      console.log("✅ Account deleted:", result);
      showToast("Account deleted successfully.", "success");

      // Refresh accounts list
      await fetchAccounts();
    } catch (error) {
      console.error("❌ Error deleting account:", error);
      showToast(
        error.response?.data?.message || "Failed to delete account",
        "error"
      );
    } finally {
      setLoading(false);
      setTableLoading(false); // Stop table loading
      setShowBackConfirmModal(false);
      setAccountToDelete(null);
    }
  };

  const SmartTooltipCell = ({ text, maxWidth = "200px" }) => {
    const textRef = useRef(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
      if (textRef.current) {
        const element = textRef.current;
        setIsTruncated(element.scrollWidth > element.clientWidth);
      }
    }, [text]);

    return (
      <td
        ref={textRef}
        className="py-4 px-4 text-[#202124] text-left truncate"
        style={{ maxWidth }}
        title={isTruncated ? text : undefined}
      >
        {text}
      </td>
    );
  };

  // Table Loading Component
  const TableLoader = () => (
    <tr>
      <td colSpan="5" className="py-8 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <InlineLoading
            text="Updating accounts data..."
            isVisible={tableLoading}
            textSize={"text-md"}
            size="medium"
          />
        </div>
      </td>
    </tr>
  );

  // Table Rows Component
  const TableRows = () => {
    if (tableLoading) {
      return <TableLoader />;
    }

    if (filteredAccounts.length === 0) {
      return (
        <tr>
          <td colSpan="5" className="py-8 text-center">
            <p className="text-gray-500">
              {searchQuery
                ? "No accounts found matching your search."
                : "No accounts available."}
            </p>
          </td>
        </tr>
      );
    }

    return filteredAccounts.map((account) => (
      <tr
        key={account.sasStaffId}
        className="border-b text-left border-gray-100 hover:bg-gray-50 transition"
      >
        <SmartTooltipCell text={account.username} maxWidth="150px" />
        <SmartTooltipCell text={account.fullName} maxWidth="200px" />
        <SmartTooltipCell text={account.role} maxWidth="120px" />
        <SmartTooltipCell text={account.email} maxWidth="200px" />
        <td className="py-4 pr-4">
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(account)}
              disabled={loading || tableLoading}
              className="p-2 bg-[#1A73E8]/23 text-[#1A73E8] rounded-lg hover:bg-[#1A73E8]/30 transition cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              <div className="flex items-center">
                <img
                  src="/assets/manage_acc/pen-blue.png"
                  alt=""
                  className="w-5 h-5"
                />
                <span className="ml-2 font-medium hidden sm:inline">Edit</span>
              </div>
            </button>

            <button
              onClick={() => {
                setAccountToDelete(account);
                setShowBackConfirmModal(true);
              }}
              disabled={loading || tableLoading}
              className="p-2 bg-[#EA4335]/20 text-red-600 rounded-lg hover:bg-red-200 transition cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              <img
                src="/assets/manage_acc/trashcan.png"
                alt=""
                className="w-5 h-5"
              />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return fetchLoading && !tableLoading ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 w-full">
      <InlineLoading
        text="Fetching accounts data..."
        isVisible={fetchLoading}
        size="largest"
      />
    </div>
  ) : (
    <div className="min-h-screen pt-9 flex lg:w-[100%]">
      <div className="flex flex-col min-h-[90vh] w-full pb-15 xl:pb-0 pr-3 pt-6 xl:pt-8 md:px-3 lg:pr-7 md:pl-15 xl:pl-9">
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
              disabled={loading || tableLoading}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3.5 bg-[#1A73E8] text-white rounded-xl sm:rounded-2xl hover:bg-[#1557B0] transition font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto"
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
            <div className="relative w-auto lg:w-80 mt-5 flex justify-start">
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
                <tr className="border-b border-t border-gray-100">
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
                <TableRows />
              </tbody>
            </table>
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
