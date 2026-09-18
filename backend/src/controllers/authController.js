const Employee = require('../models/Employee');
const Role = require('../models/Role');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email, isDeleted:false })
      .select('+password +phone +isFirstLogin +resetPasswordToken +resetPasswordExpires')
      .populate('role', 'name permissions');
    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!employee.isActive) {
      return res.status(403).json({ message: 'Employee ID is inactive' });
    }

    // First login scenario: password must be null or match phone
    // First login scenario: always require password reset if credentials match
    if (employee.isFirstLogin) {
      let match = false;
      if ((employee.password === null || employee.password === undefined)) {
        // Password not set: match phone
        match = password === employee.phone;
      } else {
        // Password is set: match hashed password
        match = await bcrypt.compare(password, employee.password);
      }
      if (match) {
        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
        employee.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        employee.resetPasswordExpires = new Date(resetPasswordExpires);
        await employee.save();
        return res.status(200).json({
          message: 'Reset your password',
          resetToken,
          expiresAt: employee.resetPasswordExpires,
          employeeId: employee._id
        });
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    }

    // Normal login
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT for primary account
    const token = jwt.sign(
      {
        id: employee._id,
        role: employee.role && employee.role._id ? employee.role._id.toString() : employee.role,
        email: employee.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '15h' }
    );

    // --- Secondary account logic: find another active, non-deleted employee with same masterEmail ---
    let secondaryToken = null;
    let secondaryUser = null;
    if (employee.masterEmail) {
      const secondaryEmployee = await Employee.findOne({
        masterEmail: employee.masterEmail,
        _id: { $ne: employee._id },
        isActive: true,
        isDeleted: { $ne: true }
      })
        .select('+password +phone +isFirstLogin')
        .populate('role', 'name permissions');
      if (secondaryEmployee) {
        secondaryToken = jwt.sign(
          {
            id: secondaryEmployee._id,
            role: secondaryEmployee.role && secondaryEmployee.role._id ? secondaryEmployee.role._id.toString() : secondaryEmployee.role,
            email: secondaryEmployee.email
          },
          process.env.JWT_SECRET,
          { expiresIn: '15h' }
        );
        secondaryUser = {
          _id: secondaryEmployee._id,
          name: secondaryEmployee.name,
          email: secondaryEmployee.email,
          phone: secondaryEmployee.phone,
          role: secondaryEmployee.role && secondaryEmployee.role.name ? secondaryEmployee.role.name : secondaryEmployee.role,
          permissions: secondaryEmployee.role?.permissions || [],
          isActive: secondaryEmployee.isActive
        };
      }
    }

    // Send JWT as httpOnly, secure cookie
    const origin = req.headers.origin;

    // Set cookies for openlogicsys.com (first-party, shared across subdomains) and avtechfin.co.in (third-party)
    if (origin?.endsWith('.openlogicsys.com') || origin === 'https://bcb.openlogicsys.com') {
      res.cookie('bciLoginToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: '.openlogicsys.com',
      });
      if (secondaryToken) {
        res.cookie('bciLoginTokenSecondary', secondaryToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          domain: '.openlogicsys.com',
        });
      }
    } else if (origin?.endsWith('.businesscoachingindia.com') || origin === 'https://ops.businesscoachingindia.com') {
      res.cookie('bciLoginToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: '.businesscoachingindia.com',
      });
      if (secondaryToken) {
        res.cookie('bciLoginTokenSecondary', secondaryToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          domain: '.businesscoachingindia.com',
        });
      }
    } else if (origin?.endsWith('.openlogichost.com') || origin === 'https://fms.openlogichost.com') {
      res.cookie('bciLoginToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: '.openlogichost.com',
      });
      if (secondaryToken) {
        res.cookie('bciLoginTokenSecondary', secondaryToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          domain: '.openlogichost.com',
        });
      }
    } 
    else if (origin?.endsWith('.avtechfin.co.in')) {
      res.cookie('bciLoginToken', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: '.avtechfin.co.in',
      });
      if (secondaryToken) {
        res.cookie('bciLoginTokenSecondary', secondaryToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          domain: '.avtechfin.co.in',
        });
      }
    }else if (origin?.startsWith('http://localhost')) {
      // For local development only
      res.cookie('bciLoginToken', token, {
        httpOnly: true,
        secure: false,         // must be false on localhost (no HTTPS)
        sameSite: 'lax',       // safe and works with local dev
      });
      if (secondaryToken) {
        res.cookie('bciLoginTokenSecondary', secondaryToken, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
        });
      }
    }

    return res.status(200).json({
      message: 'Login successful',
      user: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role && employee.role.name ? employee.role.name : employee.role,
        permissions: employee.role?.permissions || [],
        isActive: employee.isActive
      },
      secondaryUser // null if not found, otherwise user info
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { employeeId, resetToken, newPassword } = req.body;
    const employee = await Employee.findById(employeeId).select('+resetPasswordToken +resetPasswordExpires');
    if (!employee || !employee.resetPasswordToken || !employee.resetPasswordExpires) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    // Check if token is valid and not expired
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    if (
      employee.resetPasswordToken !== hashedToken ||
      employee.resetPasswordExpires < new Date()
    ) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    // Set new password
    employee.password = await bcrypt.hash(newPassword, 10);
    employee.isFirstLogin = false;
    employee.resetPasswordToken = null;
    employee.resetPasswordExpires = null;
    await employee.save();
    res.status(200).json({ message: 'Password reset successful. Please log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  const origin = req.headers.origin;

  // Clear both primary and secondary login cookies for openlogicsys.com and avtechfin.co.in
  if (origin?.endsWith('.openlogicsys.com') || origin === 'https://bcb.openlogicsys.com') {
    res.clearCookie('bciLoginToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.openlogicsys.com',
    });
    res.clearCookie('bciLoginTokenSecondary', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.openlogicsys.com',
    });
  } else if (origin?.endsWith('.businesscoachingindia.com') || origin === 'https://ops.businesscoachingindia.com') {
    res.clearCookie('bciLoginToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.businesscoachingindia.com',
    });
    res.clearCookie('bciLoginTokenSecondary', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.businesscoachingindia.com',
    });
  }  else if (origin?.endsWith('.openlogichost.com') || origin === 'https://fms.openlogichost.com') {
    res.clearCookie('bciLoginToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.openlogichost.com',
    });
    res.clearCookie('bciLoginTokenSecondary', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.openlogichost.com',
    });
  } 
  else if (origin?.endsWith('.avtechfin.co.in')) {
    res.clearCookie('bciLoginToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.avtechfin.co.in',
    });
    res.clearCookie('bciLoginTokenSecondary', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.avtechfin.co.in',
    });
  } else if (origin?.startsWith('http://localhost')) {
    res.clearCookie('bciLoginToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      // No domain for localhost
    });
    res.clearCookie('bciLoginTokenSecondary', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      // No domain for localhost
    });
  }

  return res.status(200).json({ message: 'Logged out successfully' });
};

// POST /api/auth/switch-user
exports.switchUser = (req, res) => {
  const origin = req.headers.origin;
  const token = req.cookies?.bciLoginToken;
  const secondaryToken = req.cookies?.bciLoginTokenSecondary;

  if (!token || !secondaryToken) {
    return res.status(400).json({ message: 'Both tokens must be present to switch.' });
  }

  // Swap the cookies for openlogicsys.com and avtechfin.co.in
  if (origin?.endsWith('.openlogicsys.com') || origin === 'https://bcb.openlogicsys.com') {
    res.cookie('bciLoginToken', secondaryToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.openlogicsys.com',
    });
    res.cookie('bciLoginTokenSecondary', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.openlogicsys.com',
    });
  }else if (origin?.endsWith('.businesscoachingindia.com') || origin === 'https://ops.businesscoachingindia.com') {
    res.cookie('bciLoginToken', secondaryToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.businesscoachingindia.com',
    });
    res.cookie('bciLoginTokenSecondary', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.businesscoachingindia.com',
    });
  } else if (origin?.endsWith('.openlogichost.com') || origin === 'https://fms.openlogichost.com') {
    res.cookie('bciLoginToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.openlogichost.com',
    });
    if (secondaryToken) {
      res.cookie('bciLoginTokenSecondary', secondaryToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        domain: '.openlogichost.com',
      });
    }
  } 
  else if (origin?.endsWith('.avtechfin.co.in')) {
    res.cookie('bciLoginToken', secondaryToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.avtechfin.co.in',
    });
    res.cookie('bciLoginTokenSecondary', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      domain: '.avtechfin.co.in',
    });
  } else if (origin?.startsWith('http://localhost')) {
    res.cookie('bciLoginToken', secondaryToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
    res.cookie('bciLoginTokenSecondary', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });
  }

  return res.status(200).json({ message: 'Switched user successfully' });
};
