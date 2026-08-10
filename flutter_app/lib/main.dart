import 'dart:io';
//import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:mrmegamart_app/di/locator.dart';
import 'package:mrmegamart_app/repositories/cart_repository.dart';
import 'package:mrmegamart_app/repositories/products_repository.dart';
import 'package:mrmegamart_app/routing/app_router.dart';
import 'package:mrmegamart_app/theme/colors.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mrmegamart_app/utils/auth_check.dart';
//import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load();
  } catch (e) {
    print("[DotEnv] Note: .env file loading issue: $e");
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
      print("[Stripe] Stripe disabled/unconfigured in staging. Proceeding with NullPaymentProvider.");
    }
  } catch (e) {
    print("[Stripe] Failed to initialize Stripe SDK: $e. Proceeding with NullPaymentProvider.");
  }

  try {
    await initializeApp();
  } catch (e) {
    print("[Init] Error during initializeApp: $e");
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
      print("Error during app initialization: $e");
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

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final AppRouter appRouter = AppRouter();

    return MaterialApp.router(
      title: 'MR Mega Mart',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: primaryLightColor),
        useMaterial3: true,
      ),
      routerDelegate: appRouter.router.routerDelegate,
      routeInformationParser: appRouter.router.routeInformationParser,
      routeInformationProvider: appRouter.router.routeInformationProvider,
    );
  }
}
