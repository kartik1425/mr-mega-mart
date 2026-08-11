import 'package:flutter/material.dart';

/// MR Mega Mart Centralized Brand Design Color System
class AppColors {
  // Brand Core Colors
  static const Color primary = Color(0xFF1A602B); // Emerald Grocery Green
  static const Color primaryAccent = Color(0xFF2DBE55); // Fresh Mint
  static const Color surface = Color(0xFFF8FAFC); // Slate Soft Canvas
  static const Color cardBackground = Color(0xFFFFFFFF); // Pure White Card
  
  // Typography Colors
  static const Color textPrimary = Color(0xFF0F172A); // Dark Slate Body/Headers
  static const Color textSecondary = Color(0xFF64748B); // Muted Slate Captions
  static const Color textMuted = Color(0xFF94A3B8); // Light Muted Slate
  
  // Structural Colors
  static const Color border = Color(0xFFE2E8F0); // Subtle Divider/Border
  static const Color borderFocused = Color(0xFF1A602B);
  
  // Semantic State Colors
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFD97706);
  static const Color error = Color(0xFFDC2626);
  static const Color disabled = Color(0xFFCBD5E1);

  // Legacy Aliases for 100% Backward Compatibility
  static const Color primaryDarkColor = Color(0xFF0F172A);
  static const Color primaryLightColor = Color(0xFF1A602B);
  static const Color primaryLightColorDarker = Color(0xFF144D22);
  static const Color whitePinkColor = Color(0xFFDCFCE7);
  static const Color white = Color(0xFFFFFFFF);
  static const Color gray = Color(0xFF64748B);
  static const Color offWhite = Color(0xFFF8FAFC);
  static const Color lightGray = Color(0xFFE2E8F0);
}

// Global Aliases
const Color primaryDarkColor = AppColors.primaryDarkColor;
const Color primaryLightColor = AppColors.primaryLightColor;
const Color primaryLightColorDarker = AppColors.primaryLightColorDarker;
const Color whitePinkColor = AppColors.whitePinkColor;
const Color white = AppColors.white;
const Color gray = AppColors.gray;
const Color offWhite = AppColors.offWhite;
const Color lightGray = AppColors.lightGray;
