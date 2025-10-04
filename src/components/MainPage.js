import React, { useState, useEffect } from "react";
import { useAppSelector } from "../store/hooks";
import TopNavBar from "./TopNavBar";
import Item from "./Item";
import ItemRow from "./ItemRow";
import InvoiceEmailPopup from "./InvoiceEmailPopup";
import LogoutPopUp from "./LogoutPopUp";
import { API } from "../constant";
import { loginSuccess, logout } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from '../store/hooks';
import CheckoutPopup from "./CheckoutPopup";

const MainPage = () => {
  const [cart, setCart] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const { staffName, staffNameEntryId, totalAmountEntryId, itemCountEntryId, invoiceEmailEntryId, paymentMethodEntryId, remarksEntryId, itemsEntryId, items, formSubmitUrl, passcode } = useAppSelector((state) => state.auth);
  const [invoiceEmail, setInvoiceEmail] = useState('');
  const [showEmailPopup, setShowEmailPopup] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showCheckoutPopUp, setShowCheckoutPopUp] = useState(false);


  const handleStaffNameClick = () => {
    setShowLogoutPopup(true);
  };

  const handleLogoutConfirm = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleLogout = (e) => {
    handleLogoutConfirm();
  };

  const onClickCheckout = (e) => {
    setShowCheckoutPopUp(true);
  }

  const onCancelCheckout = (e) => {
    setShowCheckoutPopUp(false);
  }


  useEffect(() => {
    if (items.length > 0) {
      return;
    }
    if (items.length === 0 && passcode) {
      fetch(API, {
        redirect: "follow",
        method: 'POST',
        body: JSON.stringify({ passcode }),
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
      })
        .then(response => response.text())
        .then(res => {
          const data = JSON.parse(res);
          if (data.success) {
            dispatch(loginSuccess({
              ...data,
            }));
          } else {
            navigate('/login');
          }
        });
    } else if (!passcode) {
      navigate('/login');
    }
    // eslint-disable-next-line
  }, [items]);

  // Calculate total and item count
  const total = Object.entries(cart).reduce((sum, [itemId, quantity]) => {
    const item = items.find(item => item.id === itemId);
    return sum + (item ? item.price * quantity : 0);
  }, 0);

  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  // Format cart items for display
  const cartItems = Object.entries(cart)
    .filter(([itemId, quantity]) => quantity > 0)
    .map(([itemId, quantity]) => {
      const item = items.find(item => item.id === itemId);
      return item ? { ...item, quantity } : null;
    })
    .filter(Boolean);

  const handleQuantityChange = (itemId, newQuantity) => {
    setCart(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));
  };

  const handleViewModeToggle = () => {
    setViewMode(prev => prev === 'grid' ? 'table' : 'grid');
  };

  const handleEmailButtonClick = () => {
    setShowEmailPopup(true);
  };

  const handleEmailSave = (email) => {
    setInvoiceEmail(email);
  };

  const handleEmailPopupClose = () => {
    setShowEmailPopup(false);
  };

  const onClearContents = async ({email, paymentMethod, remarks}) => {
    // Reset cart
    setShowCheckoutPopUp(false);
    setCart({});
    setInvoiceEmail('');
    return true;
  };

  return (
    <div className={`main-page bg-primary min-h-screen t-0 w-full pt-[68px] ${showCheckoutPopUp? 'fixed': ''}`}>
      <TopNavBar total={total} itemCount={itemCount} onClickCheckout={onClickCheckout} cartItems={cartItems} />
      


      {/* Show staff name in the top right, similar to TopNavBar, but only if staffName is set */}
      <div className="flex justify-between items-center max-w-5xl mx-auto mb-2 px-2">
          <span
            className="text-xs text-white cursor-pointer hover:underline transition"
            onClick={handleStaffNameClick}
            title="Click to logout"
          >
            Staff: {staffName}
          </span>
        </div>
      <div className="flex justify-between items-center max-w-5xl mx-auto px-2 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={handleViewModeToggle}
            title={`Switch to ${viewMode === 'grid' ? 'table' : 'grid'} view`}
          >
            {viewMode === 'grid' ? 'Table View' : 'Grid View'}
          </button>
          <button
            type="button"
            className="btn-sm btn-primary"
            disabled={isSubmitting || itemCount === 0}
            onClick={() => setCart({})}
            title="Reset all quantities"
          >
            Reset
          </button>
        </div>
        
        <button
          className="btn-primary-outline btn-sm"
          onClick={handleEmailButtonClick}
        >
          {invoiceEmail ? `${invoiceEmail} (Edit)` : 'No Invoice Email (Add)'}
        </button>
      </div>
      
      {viewMode === 'grid' ? (
        <div className="items-grid grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-1 max-w-5xl mx-auto px-2 pb-8">
          {items.map(item => (
            <Item
              key={item.id}
              item={item}
              quantity={cart[item.id] || 0}
              onQuantityChange={handleQuantityChange}
            />
          ))}
        </div>
      ) : (
        <div className="items-table-container max-w-5xl mx-auto px-2 pb-8">
          <table className="items-table w-full border border-gray-200  bg-primary shadow-sm">
            <tbody>
              {items.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  quantity={cart[item.id] || 0}
                  onQuantityChange={handleQuantityChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Email Popup */}
      {showEmailPopup && <InvoiceEmailPopup
        isOpen={showEmailPopup}
        onClose={handleEmailPopupClose}
        onSave={handleEmailSave}
        currentEmail={invoiceEmail}
      />
}
      {/* Logout Popup */}
      {showLogoutPopup && (
        <LogoutPopUp
          isOpen={showLogoutPopup}
          onCancel={() => setShowLogoutPopup(false)}
          onConfirm={handleLogout}
        />
      )}

      {showCheckoutPopUp && (
      <CheckoutPopup
        isOpen={showCheckoutPopUp}
        onClose={onCancelCheckout}
        total={total}
        itemCount={itemCount}
        cartItems={items
          .filter(item => cart[item.id] > 0)
          .map(item => ({
            ...item,
            quantity: cart[item.id]
          }))
        }
        onClearContents={onClearContents}
        invoiceEmail={invoiceEmail}
        onInvoiceEmailChange={setInvoiceEmail}
      />
      )}
    </div>
  );
};

export default MainPage;
