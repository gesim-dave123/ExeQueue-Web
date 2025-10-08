import React, { useState } from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import InputModal from '../../components/modal/InputModal';
import ConfirmModal from '../../components/modal/ConfirmModal';
export default function ManageAccount() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [nextId, setNextId] = useState(5); // Start at 5 since you have 4 initial accounts
  const [showBackConfirmModal, setShowBackConfirmModal] = useState(false);
  const [isPopup, setIsPopup] = useState(true); 
  const [userData, setUserData] = useState(null);
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      username: 'aldriel23',
      firstName: 'Aldrie',
      lastName: 'Abais',
      fullName: 'Aldrie Abais',
      role: 'Working Scholar',
      email: 'aldrieabais@gmail.com'
    },
    {
      id: 2,
      username: 'somhwo',
      firstName: 'Samantha',
      lastName: 'Singcol',
      fullName: 'Samantha Singcol',
      role: 'Working Scholar',
      email: 'somhwo@gmail.com'
    },
    {
      id: 3,
      username: 'maxver33',
      firstName: 'Max',
      lastName: ' Verstappen',
      fullName: 'Max Verstappen',
      role: 'Working Scholar',
      email: 'maxvers33@gmail.com'
    },
    {
      id: 4,
      username: 'jacinthBrrl',
      firstName: 'Jacinth',
      lastName: 'Cedric Barral',
      fullName: 'Jacinth Cedric Barral',
      role: 'Working Scholar',
      email: 'jacinthced@gmail.com'
    }
  ]);

  const handleFormSubmit = (data) => {
    setUserData(data);
    setIsModalOpen(false); // close modal after successful input
  };

  const filteredAccounts = accounts.filter(account =>
    account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (account) => {
  
  setSelectedAccount({
    id: account.id,
    firstName: account.firstName,
    lastName: account.lastName,
    username: account.username,
    email: account.email
  });
  setIsEditMode(true);
  setIsModalOpen(true);
};

  const handleAddAccount = () => {
    setSelectedAccount({
      firstName: '',
      lastName: '',
      username: '',
      email: ''
    });
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  // Update handleSave for adding accounts
const handleSave = (formData) => {
  if (isEditMode) {
    // Update existing account
    setAccounts(accounts.map(account => 
      account.id === selectedAccount.id 
        ? {
            ...account,
            firstName: formData.firstName,
            lastName: formData.lastName,
            fullName: `${formData.firstName} ${formData.lastName}`,
            username: formData.username,
            email: formData.email
          }
        : account
    ));
  } else {
    // Add new account with guaranteed unique ID
    const newAccount = {
      id: nextId,
      username: formData.username,
      firstName: formData.firstName,
      lastName: formData.lastName,
      fullName: `${formData.firstName} ${formData.lastName}`,
      role: 'Working Scholar',
      email: formData.email
    };
    setAccounts([...accounts, newAccount]);
    setNextId(nextId + 1); // Increment for next account
  }
};

  const handleDelete = (account) => {
    setAccounts(accounts.filter(acc => acc.id !== account.id));
    console.log('Deleted account:', account);
  };

  return (
    <div className="min-h-screen py-9 flex lg:w-[100%]">
      <div className='flex flex-col min-h-[90vh]  w-full  justify-evenly px-9'>

      
      {/* Header */}
      <div className="flex flex-1 pt-6 items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-left text-[#202124]">Manage Accounts</h1>
          <p className="text-left text-[#686969]">Personnel account management</p>
        </div>
        <button 
          onClick={() => {
            handleAddAccount();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3.5 bg-[#1A73E8] text-white rounded-2xl hover:bg-blue-700 transition font-medium cursor-pointer"
        >
          <div className="inline-block ">
              <img src="/assets/manage_acc/add.png" alt="" />
          </div>
     
          Add Account
        </button>
          
      </div>

      {/* Personnel Accounts Card */}
      <div className="bg-white  rounded-2xl shadow-xs p-6 flex-6 overflow-y-scroll scrollbar-thumb-blue-500 scrollbar-track-gray-200   max-h-[80vh]">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-6 sticky">
          <h2 className="text-xl font-medium text-[#202124]">Personnel Accounts</h2>
          
          {/* Search Bar */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
             required
              type="text"
              placeholder="Search by username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

      {/* Table Container */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 sticky top-0">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-48">Username</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-64">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-40">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-80">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#686969] w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="text-left py-4 px-4 text-[#202124] ">{account.username}</td>
                    <td className="text-left py-4 px-4 text-[#202124] ">{account.fullName}</td>
                    <td className="text-left py-4 px-4 text-[#202124] ">{account.role}</td>
                    <td className="text-left py-4 px-4 text-[#202124] ">{account.email}</td>
                    <td className="text-left py-4 px-4 w-40">
                      <div className="flex items-center justify-start gap-2">
                        <button 
                          onClick={() => {
                            handleEdit(account);
                            setIsModalOpen(true);
                            setSelectedAccount(account);
                          }}
                          className="p-2 bg-[#26BA33]/20 text-green-600 rounded-lg hover:bg-green-200 transition cursor-pointer"
                        >
                          <img src="/assets/manage_acc/update.png" alt="Edit" />
                        </button>
                        <button 
                          onClick={() => {
                            setAccountToDelete(account);
                            setShowBackConfirmModal(true);
                          }}
                          className="p-2 bg-[#EA4335]/20 text-red-600 rounded-lg hover:bg-red-200 transition cursor-pointer"
                        >
                          <img src="/assets/manage_acc/trashcan.png" alt="Delete" />
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
                <p className="text-gray-500">No accounts found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

     {/* SINGLE Modal - placed at the end */}
      <InputModal
        title={isEditMode ? "Update Account" : "Add Account"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        accountData={selectedAccount}
        onSave={handleSave}
        submitType={isEditMode ? "Update Account" : "Add Account"}
        details={isEditMode ? "Edit account details for" : "Add a new account for"}
      />
        <ConfirmModal
              isOpen={showBackConfirmModal}
              onClose={() => setShowBackConfirmModal(false)}
              onConfirm={() => {
                  if (accountToDelete) {
                    handleDelete(accountToDelete);
                    setShowBackConfirmModal(false);
                    setAccountToDelete(null);
                  }
                }}
              // loading={loading}
              // progress={progress}
              icon="/assets/manage_acc/caution.png"
              iconAlt="Warning"
              iconSize="w-12 h-12"
              showLoading={true}
              title='Delete Account'
              cancelText = "Cancel"
              confirmText = "Remove"
              showCloseButton={false}  
              hideActions={false} 
              cancelButtonClass="px-4 py-3 bg-[#E2E3E4] text-black hover:bg-[#c6c7c8] rounded-xl w-1/2 font-medium cursor-pointer"
              confirmButtonClass="px-4 py-3 bg-[#EA4335] text-white hover:bg-red-700 rounded-xl w-1/2 font-medium cursor-pointer"
              description={
                <>
                  Are you sure you want to delete this account?<br />
                  This action can't be undone.
                </>
              }
               />
    </div>
    </div>
  ); 
}