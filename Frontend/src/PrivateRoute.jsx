import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const PrivateRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const [redirect, setRedirect] = useState({ status: false, path: "" });

  useEffect(() => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để tiếp tục");
      setTimeout(() => {
        setRedirect({ status: true, path: "/login" });
      }, 100);
    } else if (allowedRoles !== user.roleName) {
      toast.error("Bạn không có quyền truy cập");
      setTimeout(() => {
        setRedirect({ status: true, path: "/" });
      }, 100);
    }
  }, [user, allowedRoles]);

  if (redirect.status) {
    return <Navigate to={redirect.path} replace />;
  }

  if (!user || allowedRoles !== user.roleName) {
    return null; 
  }

  return children;
};

export default PrivateRoute;
