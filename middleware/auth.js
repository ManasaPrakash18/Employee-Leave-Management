export const ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  
  req.flash('error_msg', 'Please log in to view this resource');
  res.redirect('/login');
};

export const ensureEmployee = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'employee') {
    return next();
  }
  
  req.flash('error_msg', 'Access denied. Employee area only.');
  res.redirect('/');
};

export const ensureManager = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'manager') {
    return next();
  }
  
  req.flash('error_msg', 'Access denied. Manager area only.');
  res.redirect('/');
};

export default {
  ensureAuthenticated,
  ensureEmployee,
  ensureManager
};