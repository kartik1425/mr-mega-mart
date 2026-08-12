import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:mrmegamart_app/bloc/products/products_bloc.dart';
import 'package:mrmegamart_app/bloc/products/products_event.dart';
import 'package:mrmegamart_app/bloc/products/products_state.dart';
import 'package:mrmegamart_app/bloc/cart/operations/feed/add_cart_item_on_feed_bloc.dart';
import 'package:mrmegamart_app/bloc/cart/operations/feed/add_cart_item_on_feed_event.dart';
import 'package:mrmegamart_app/bloc/cart/operations/feed/add_cart_item_on_feed_state.dart';
import 'package:mrmegamart_app/components/product_card.dart';
import 'package:mrmegamart_app/services/categories_api_service.dart';
import 'package:mrmegamart_app/theme/colors.dart';
import 'package:mrmegamart_app/theme/text_styles.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedCategoryIndex = 0;
  late ProductsBloc _productsBloc;
  late AddCartItemOnFeedBloc _addCartItemOnFeedBloc;
  String? _loadingProductId;

  // Dynamic categories fetched from API
  List<Map<String, dynamic>> _categories = [
    {'id': 'all', 'name': 'ALL', 'icon': Icons.grid_view_rounded},
  ];
  bool _categoriesLoading = true;

  @override
  void initState() {
    super.initState();
    _productsBloc = ProductsBloc()
      ..add(const ProductsRequested(page: 1))
      ..add(FetchLikedProductsFromLocal())
      ..add(FetchCartItemsFromLocal());
    _addCartItemOnFeedBloc = AddCartItemOnFeedBloc();
    _fetchCategories();
  }

  Future<void> _fetchCategories() async {
    try {
      final categoriesService = CategoriesApiService();
      final response = await categoriesService.getRootCategories();
      if (response.success && response.categories.isNotEmpty) {
        final List<Map<String, dynamic>> apiCategories = [
          {'id': 'all', 'name': 'ALL', 'icon': Icons.grid_view_rounded},
        ];

        // Map category names to icons
        const categoryIcons = {
          'bakery': Icons.bakery_dining_outlined,
          'bread': Icons.bakery_dining_outlined,
          'snack': Icons.cookie_outlined,
          'biscuit': Icons.cookie_outlined,
          'staple': Icons.rice_bowl_outlined,
          'grain': Icons.rice_bowl_outlined,
          'beverage': Icons.local_drink_outlined,
          'drink': Icons.local_drink_outlined,
          'dairy': Icons.water_drop_outlined,
          'egg': Icons.egg_outlined,
          'household': Icons.cleaning_services_outlined,
          'clean': Icons.cleaning_services_outlined,
          'fruit': Icons.apple,
          'vegetable': Icons.eco_outlined,
          'meat': Icons.set_meal_outlined,
          'frozen': Icons.ac_unit_outlined,
          'personal': Icons.face_outlined,
          'baby': Icons.child_care_outlined,
        };

        for (final cat in response.categories) {
          IconData icon = Icons.category_outlined;
          final nameLower = cat.name.toLowerCase();
          for (final entry in categoryIcons.entries) {
            if (nameLower.contains(entry.key)) {
              icon = entry.value;
              break;
            }
          }
          apiCategories.add({
            'id': cat.id, // Real MongoDB ObjectId
            'name': cat.name,
            'icon': icon,
          });
        }

        if (mounted) {
          setState(() {
            _categories = apiCategories;
            _categoriesLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _categoriesLoading = false);
      }
    } catch (_) {
      if (mounted) setState(() => _categoriesLoading = false);
    }
  }

  @override
  void dispose() {
    _productsBloc.close();
    _addCartItemOnFeedBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _productsBloc),
        BlocProvider.value(value: _addCartItemOnFeedBloc),
      ],
      child: Scaffold(
        backgroundColor: AppColors.surface,
        body: SafeArea(
          child: Column(
            children: [
              // Top Location & Header Row
              Padding(
                padding: const EdgeInsets.fromLTRB(16.0, 10.0, 16.0, 8.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: const BoxDecoration(
                            color: AppColors.softGreen,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.location_on_rounded,
                            color: AppColors.primary,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 10.0),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Delivery to',
                              style: AppTextStyles.caption.copyWith(
                                color: AppColors.textSecondary,
                                fontSize: 11,
                              ),
                            ),
                            Row(
                              children: [
                                Text(
                                  'My Home',
                                  style: AppTextStyles.bodyMedium.copyWith(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                                const Icon(
                                  Icons.keyboard_arrow_down_rounded,
                                  size: 18,
                                  color: AppColors.textSecondary,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.notifications_none_rounded, color: AppColors.textPrimary, size: 24),
                          onPressed: () {},
                        ),
                        Stack(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.shopping_bag_outlined, color: AppColors.textPrimary, size: 24),
                              onPressed: () => context.pushNamed('cart'),
                            ),
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                constraints: const BoxConstraints(
                                  minWidth: 8,
                                  minHeight: 8,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
                child: InkWell(
                  onTap: () => context.pushNamed('search'),
                  borderRadius: BorderRadius.circular(14.0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14.0),
                      border: Border.all(color: AppColors.border, width: 1.0),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.search_rounded, color: AppColors.textSecondary, size: 22),
                        const SizedBox(width: 10.0),
                        Expanded(
                          child: Text(
                            'Search groceries, fruits, snacks...',
                            style: AppTextStyles.body.copyWith(
                              color: AppColors.textMuted,
                              fontSize: 14,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppColors.softGreen,
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          child: const Icon(Icons.tune_rounded, color: AppColors.primary, size: 18),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Horizontal Category Selector
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 10.0),
                child: SizedBox(
                  height: 38,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final category = _categories[index];
                      final isSelected = _selectedCategoryIndex == index;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: InkWell(
                          onTap: () {
                            setState(() {
                              _selectedCategoryIndex = index;
                            });
                            final catId = category['id'] == 'all' ? null : category['id'] as String;
                            _productsBloc.add(ProductsRequested(page: 1, categoryId: catId));
                          },
                          borderRadius: BorderRadius.circular(20.0),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 8.0),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.softGreen : Colors.white,
                              borderRadius: BorderRadius.circular(20.0),
                              border: Border.all(
                                color: isSelected ? AppColors.primary : AppColors.border,
                                width: 1.0,
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  category['icon'] as IconData,
                                  size: 16,
                                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                                ),
                                const SizedBox(width: 6.0),
                                Text(
                                  category['name'] as String,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                    color: isSelected ? AppColors.primary : AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),

              // Main Shopping Scroll Area
              Expanded(
                child: BlocListener<AddCartItemOnFeedBloc, AddCartItemOnFeedState>(
                  listener: (context, addCartState) {
                    if (addCartState.isLoading) {
                      setState(() {
                        _loadingProductId = addCartState.currentProductId;
                      });
                    }
                    if (addCartState.isFailure) {
                      final String errorMsg = addCartState.errorMessage;
                      if (errorMsg.toLowerCase().contains('unauthorized') || errorMsg.contains('401')) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Please sign in to add items to your cart.'),
                            backgroundColor: AppColors.primary,
                          ),
                        );
                        context.pushNamed('login');
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Error: $errorMsg'), backgroundColor: AppColors.error),
                        );
                      }
                      setState(() { _loadingProductId = null; });
                    }
                    if (addCartState.isSuccess && addCartState.response != null) {
                      _productsBloc.add(FetchCartItemsFromLocal());
                      setState(() { _loadingProductId = null; });
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(addCartState.response!.message), backgroundColor: AppColors.success),
                      );
                    }
                  },
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Single Restrained Hero Campaign Banner
                        Container(
                          width: double.infinity,
                          height: 160,
                          margin: const EdgeInsets.only(bottom: 20.0),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF168A3A), Color(0xFF2DBE55)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(20.0),
                          ),
                          child: Stack(
                            children: [
                              Padding(
                                padding: const EdgeInsets.all(20.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Text(
                                        'LIMITED OFFER',
                                        style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    const Text(
                                      'Fresh Groceries\nDelivered Today',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        height: 1.2,
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    ElevatedButton(
                                      onPressed: () => context.pushNamed('search'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.white,
                                        foregroundColor: AppColors.primary,
                                        elevation: 0,
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                        minimumSize: const Size(0, 34),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      ),
                                      child: const Text('Shop Now', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                right: 12,
                                bottom: 12,
                                child: Icon(
                                  Icons.shopping_basket_rounded,
                                  size: 110,
                                  color: Colors.white.withValues(alpha: 0.25),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Section Header: Special Offers
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Special Offers', style: AppTextStyles.sectionTitle),
                            TextButton(
                              onPressed: () => context.pushNamed('search'),
                              child: const Text('View All', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8.0),

                        // Product Grid / Catalog
                        BlocBuilder<ProductsBloc, ProductsState>(
                          builder: (context, state) {
                            if (state.isLoading) {
                              return const Padding(
                                padding: EdgeInsets.all(32.0),
                                child: Center(
                                  child: CircularProgressIndicator(color: AppColors.primary),
                                ),
                              );
                            }
                            if (state.isFailure) {
                              return Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Center(
                                  child: Text('Unable to load products. ${state.errorMessage ?? ""}', style: const TextStyle(color: AppColors.error)),
                                ),
                              );
                            }
                            if (state.productsResponse != null && state.productsResponse!.products.isNotEmpty) {
                              final products = state.productsResponse!.products;

                              return ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: products.length,
                                itemBuilder: (context, index) {
                                  final product = products[index];
                                  final isLiked = state.likedProductIds.contains(product.id);
                                  final productInCart = state.itemsInCart.contains(product.id);

                                  return ProductCard(
                                    product: product,
                                    onAddToCart: () {
                                      if (!productInCart) {
                                        context.read<AddCartItemOnFeedBloc>().add(AddFeedItemEvent(productId: product.id));
                                      }
                                    },
                                    onLikeTap: () {
                                      if (isLiked) {
                                        _productsBloc.add(RemoveLikeEvent(productId: product.id));
                                      } else {
                                        _productsBloc.add(AddLikeEvent(productId: product.id));
                                      }
                                    },
                                    onProductClicked: (productId) {
                                      context.pushNamed("productDetailsPage", pathParameters: {"productId": productId});
                                    },
                                    isLiked: isLiked,
                                    isLoading: (_loadingProductId == product.id),
                                    productInCart: productInCart,
                                  );
                                },
                              );
                            }
                            return const Center(child: Text('No products available.'));
                          },
                        ),
                        const SizedBox(height: 20.0),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
