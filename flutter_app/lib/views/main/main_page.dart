import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mrmegamart_app/utils/auth_check.dart';
import 'package:mrmegamart_app/views/main/pages/account_page.dart';
import 'package:mrmegamart_app/views/main/pages/cart_page.dart';
import 'package:mrmegamart_app/views/main/pages/home/home_page.dart';
import 'package:mrmegamart_app/views/orders/my_orders_page.dart';
import 'package:mrmegamart_app/views/search/search_page.dart';
import '../../theme/colors.dart';

class MainPage extends StatefulWidget {
  const MainPage({super.key});

  @override
  State<MainPage> createState() => _MainPageState();
}

class _MainPageState extends State<MainPage> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const HomePage(),
    const SearchPage(isTrial: false),
    const CartPage(fromProductFeed: false),
    const MyOrdersPage(fromAccount: false),
    const AccountPage(),
  ];

  void _onTabTapped(int index) async {
    if (index != 0 && index != 1) {
      bool isUserAuthenticated = await isAuthenticated();
      if (!mounted) return;
      if (!isUserAuthenticated) {
        context.goNamed("signup");
        return;
      }
    }
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: AppColors.border, width: 1.0),
          ),
        ),
        child: NavigationBarTheme(
          data: NavigationBarThemeData(
            indicatorColor: AppColors.softGreen,
            labelTextStyle: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.selected)) {
                return const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                );
              }
              return const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondary,
              );
            }),
            iconTheme: WidgetStateProperty.resolveWith((states) {
              if (states.contains(WidgetState.selected)) {
                return const IconThemeData(color: AppColors.primary, size: 24);
              }
              return const IconThemeData(color: AppColors.textSecondary, size: 24);
            }),
          ),
          child: NavigationBar(
            selectedIndex: _currentIndex,
            onDestinationSelected: _onTabTapped,
            backgroundColor: Colors.white,
            elevation: 0,
            height: 65,
            destinations: const [
              NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home),
                label: "Home",
              ),
              NavigationDestination(
                icon: Icon(Icons.grid_view_outlined),
                selectedIcon: Icon(Icons.grid_view),
                label: "Categories",
              ),
              NavigationDestination(
                icon: Icon(Icons.shopping_bag_outlined),
                selectedIcon: Icon(Icons.shopping_bag),
                label: "Cart",
              ),
              NavigationDestination(
                icon: Icon(Icons.receipt_long_outlined),
                selectedIcon: Icon(Icons.receipt_long),
                label: "Orders",
              ),
              NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person),
                label: "Account",
              ),
            ],
          ),
        ),
      ),
    );
  }
}
