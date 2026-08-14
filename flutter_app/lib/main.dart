import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:mrmegamart_app/di/locator.dart';
import 'package:mrmegamart_app/repositories/cart_repository.dart';
import 'package:mrmegamart_app/repositories/products_repository.dart';
import 'package:mrmegamart_app/routing/app_router.dart';
import 'package:mrmegamart_app/theme/colors.dart';
import 'package:mrmegamart_app/theme/text_styles.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mrmegamart_app/utils/auth_check.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load();
  } catch (e) {
    debugPrint("[DotEnv] Note: .env file loading issue: $e");
  }

  setupLocator();

  if (Platform.isAndroid) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        statusBarBrightness: Brightness.light,
      ),
    );
  }

  try {
    if (setupStripeKey()) {
      await Stripe.instance.applySettings();
    } else {
      debugPrint("[Stripe] Stripe disabled/unconfigured in staging. Proceeding with NullPaymentProvider.");
    }
  } catch (e) {
    debugPrint("[Stripe] Failed to initialize Stripe SDK: $e. Proceeding with NullPaymentProvider.");
  }

  try {
    await initializeApp();
  } catch (e) {
    debugPrint("[Init] Error during initializeApp: $e");
  }

  runApp(const MyApp());
}

Future<void> initializeApp() async {
  final isUserAuthenticated = await isAuthenticated();

  if (isUserAuthenticated) {
    final cartRepository = getIt<CartRepository>();
    final productsRepository = getIt<ProductsRepository>();

    try {
      await Future.wait([
        cartRepository.getCartItemsAndSaveToLocal(),
        productsRepository.getLikedProductIdsAndSaveToLocal(),
      ]);
    } catch (e) {
      debugPrint("Error during app initialization: $e");
    }
  }
}

bool setupStripeKey() {
  final publishableKey = dotenv.env['STRIPE_PUBLISHABLE_KEY'];

  if (publishableKey == null || publishableKey.isEmpty) {
    return false;
  }
  Stripe.publishableKey = publishableKey;
  Stripe.merchantIdentifier = 'mrmegamart-merchant';
  Stripe.urlScheme = 'mrmegamart';
  return true;
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final AppRouter _appRouter = AppRouter();

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'MR Mega Mart',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme(
          brightness: Brightness.light,
          primary: AppColors.primary,
          onPrimary: Colors.white,
          secondary: AppColors.primaryAccent,
          onSecondary: Colors.white,
          error: AppColors.error,
          onError: Colors.white,
          surface: AppColors.surface,
          onSurface: AppColors.textPrimary,
        ),
        scaffoldBackgroundColor: AppColors.surface,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.surface,
          elevation: 0,
          scrolledUnderElevation: 0.5,
          centerTitle: false,
          iconTheme: IconThemeData(color: AppColors.textPrimary),
          titleTextStyle: AppTextStyles.sectionTitle,
        ),
        cardTheme: CardThemeData(
          color: AppColors.cardBackground,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16.0),
            side: const BorderSide(color: AppColors.border, width: 1.0),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12.0),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12.0),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12.0),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12.0),
            borderSide: const BorderSide(color: AppColors.error),
          ),
          hintStyle: AppTextStyles.caption.copyWith(color: AppColors.textMuted),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 14.0, horizontal: 20.0),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12.0),
            ),
            textStyle: AppTextStyles.button,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary,
            side: const BorderSide(color: AppColors.primary, width: 1.2),
            padding: const EdgeInsets.symmetric(vertical: 14.0, horizontal: 20.0),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12.0),
            ),
            textStyle: AppTextStyles.button.copyWith(color: AppColors.primary),
          ),
        ),
        chipTheme: ChipThemeData(
          backgroundColor: Colors.white,
          selectedColor: AppColors.primary,
          secondarySelectedColor: AppColors.primary,
          padding: const EdgeInsets.symmetric(horizontal: 12.0, vertical: 8.0),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20.0),
            side: const BorderSide(color: AppColors.border),
          ),
          labelStyle: AppTextStyles.bodyMedium,
          secondaryLabelStyle: AppTextStyles.bodyMedium.copyWith(color: Colors.white),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Colors.white,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textSecondary,
          type: BottomNavigationBarType.fixed,
          elevation: 8.0,
        ),
      ),
      routerDelegate: _appRouter.router.routerDelegate,
      routeInformationParser: _appRouter.router.routeInformationParser,
      routeInformationProvider: _appRouter.router.routeInformationProvider,
    );
  }
}
