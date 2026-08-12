import 'package:flutter/material.dart';

/// MR Mega Mart Centralized Brand Design Color System — Phase 13 Specification
class AppColors {
  // Brand Core Colors (Phase 13 Reference Palette)
  static const Color primary = Color(0xFF168A3A); // Emerald Grocery Green
  static const Color primaryDark = Color(0xFF0F6B2C); // Deep Forest Green
  static const Color primaryAccent = Color(0xFF2DBE55); // Fresh Mint Accent
  static const Color softGreen = Color(0xFFEAF8EE); // Soft Green Surface Highlight
  static const Color surface = Color(0xFFF8FAF8); // Pale Neutral App Canvas
  static const Color cardBackground = Color(0xFFFFFFFF); // Pure White Surface
  
  // Typography Colors
  static const Color textPrimary = Color(0xFF18201A); // Dark Commercial Slate Text
  static const Color textSecondary = Color(0xFF6B756D); // Muted Secondary Slate
  static const Color textMuted = Color(0xFF9EA69F); // Light Subtitle Muted Slate
  
  // Structural & Border Colors
  static const Color border = Color(0xFFE5EAE6); // Subtle Card/Divider Border
  static const Color borderFocused = Color(0xFF168A3A);
  
  // Semantic State Colors
  static const Color success = Color(0xFF168A3A);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFD92D20);
  static const Color disabled = Color(0xFFCBD5E1);

  // Legacy Aliases for 100% Backward Compatibility
  static const Color primaryDarkColor = Color(0xFF0F6B2C);
  static const Color primaryLightColor = Color(0xFF168A3A);
  static const Color primaryLightColorDarker = Color(0xFF0F6B2C);
  static const Color whitePinkColor = Color(0xFFEAF8EE);
  static const Color white = Color(0xFFFFFFFF);
  static const Color gray = Color(0xFF6B756D);
  static const Color offWhite = Color(0xFFF8FAF8);
  static const Color lightGray = Color(0xFFE5EAE6);
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
