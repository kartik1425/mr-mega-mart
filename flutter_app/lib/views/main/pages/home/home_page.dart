import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mrmegamart_app/components/horizontal_scroll_widget.dart';
import 'package:mrmegamart_app/components/textfields/non_editable_field.dart';
import 'package:mrmegamart_app/theme/colors.dart';
import 'package:mrmegamart_app/theme/text_styles.dart';
import 'dynamic_tab_view.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int selectedTabId = 1;

  final List<Map<String, dynamic>> categories = [
    {'id': 1, 'name': 'Top Deals'},
    {'id': 2, 'name': 'AI Suggestions'},
    {'id': 3, 'name': 'Best of Week'},
    {'id': 4, 'name': 'Best of Month'},
  ];

  @override
  Widget build(BuildContext context) {
    final double statusBarHeight = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Emerald Header Container
          Container(
            decoration: const BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(20.0),
                bottomRight: Radius.circular(20.0),
              ),
            ),
            padding: EdgeInsets.only(
              top: statusBarHeight + 12.0,
              bottom: 12.0,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Brand Header Row
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6.0),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(10.0),
                            ),
                            child: const Icon(
                              Icons.shopping_basket_rounded,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 10.0),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'MR Mega Mart',
                                style: AppTextStyles.sectionTitle.copyWith(
                                  color: Colors.white,
                                  fontSize: 19,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.3,
                                ),
                              ),
                              Text(
                                'Fresh Groceries Delivered',
                                style: AppTextStyles.caption.copyWith(
                                  color: Colors.white.withValues(alpha: 0.85),
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.shopping_cart_outlined, color: Colors.white, size: 24),
                        onPressed: () => context.pushNamed('cart'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10.0),

                // Search Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: NonEditableField(
                    placeholder: "Search groceries, fruits, snacks...",
                    icon: Icons.search,
                    onTap: () {
                      context.pushNamed('search');
                    },
                  ),
                ),
                const SizedBox(height: 12.0),

                // Horizontal Category Tab Selector
                HorizontalScrollWidget(
                  items: categories,
                  backgroundColor: Colors.transparent,
                  onItemTap: (int id) {
                    setState(() {
                      selectedTabId = id;
                    });
                  },
                ),
              ],
            ),
          ),

          // Dynamic Content Tab View
          Expanded(
            child: DynamicTabView(
              selectedTabId: selectedTabId,
            ),
          ),
        ],
      ),
    );
  }
}
