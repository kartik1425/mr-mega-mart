import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:mrmegamart_app/models/product/product_model.dart';
import 'package:mrmegamart_app/theme/colors.dart';
import 'package:mrmegamart_app/theme/text_styles.dart';
import 'package:go_router/go_router.dart';
import 'buttons/heart_button.dart';
import 'product_rating_stars.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onAddToCart;
  final VoidCallback onLikeTap;
  final ValueChanged<String> onProductClicked;
  final bool isLiked;
  final bool isLoading;
  final bool productInCart;
  final int quantityInCart;
  final VoidCallback? onIncrement;
  final VoidCallback? onDecrement;

  const ProductCard({
    super.key,
    required this.product,
    required this.onAddToCart,
    required this.onLikeTap,
    required this.onProductClicked,
    this.isLiked = false,
    this.isLoading = false,
    this.productInCart = false,
    this.quantityInCart = 1,
    this.onIncrement,
    this.onDecrement,
  });

  String _formatWeight(double weightInKg) {
    if (weightInKg >= 1.0) {
      return '${weightInKg.toStringAsFixed(weightInKg.truncateToDouble() == weightInKg ? 0 : 1)} kg';
    } else {
      return '${(weightInKg * 1000).toInt()} g';
    }
  }

  @override
  Widget build(BuildContext context) {
    final double displayPrice = product.salePrice ?? product.price;
    final double? oldPrice = product.oldPrice ?? (product.salePrice != null ? product.price : null);
    final int? discountPercent = (oldPrice != null && oldPrice > displayPrice)
        ? (((oldPrice - displayPrice) / oldPrice) * 100).round()
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12.0),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16.0),
        border: Border.all(color: AppColors.border, width: 1.0),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 8.0,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16.0),
        child: InkWell(
          borderRadius: BorderRadius.circular(16.0),
          onTap: () => onProductClicked(product.id),
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product Image Container with Badges
                Stack(
                  children: [
                    Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12.0),
                      ),
                      padding: const EdgeInsets.all(6.0),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8.0),
                        child: CachedNetworkImage(
                          imageUrl: product.imageURLs.isNotEmpty ? product.imageURLs.first : '',
                          fit: BoxFit.contain,
                          placeholder: (context, url) => const Center(
                            child: SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2.0, color: AppColors.primary),
                            ),
                          ),
                          errorWidget: (context, url, error) => const Icon(
                            Icons.shopping_bag_outlined,
                            size: 36,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                    if (discountPercent != null && discountPercent > 0)
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6.0, vertical: 3.0),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(6.0),
                          ),
                          child: Text(
                            '$discountPercent% OFF',
                            style: AppTextStyles.caption.copyWith(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 14.0),

                // Product Information & Actions
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Title
                                Text(
                                  product.title,
                                  style: AppTextStyles.productTitle,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4.0),
                                // Weight / Unit Label
                                Text(
                                  _formatWeight(product.cargoWeight),
                                  style: AppTextStyles.caption.copyWith(color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          HeartButton(
                            isLiked: isLiked,
                            onLikeTap: onLikeTap,
                          ),
                        ],
                      ),
                      const SizedBox(height: 6.0),

                      // Ratings & Stock Status
                      Row(
                        children: [
                          ProductRatingStars(rating: product.averageRating),
                          const SizedBox(width: 4.0),
                          Text(
                            '(${product.reviewCount})',
                            style: AppTextStyles.caption,
                          ),
                          const SizedBox(width: 8.0),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6.0, vertical: 2.0),
                            decoration: BoxDecoration(
                              color: product.stockCount > 0
                                  ? AppColors.success.withValues(alpha: 0.1)
                                  : AppColors.error.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4.0),
                            ),
                            child: Text(
                              product.stockCount > 0 ? 'In Stock' : 'Out of Stock',
                              style: AppTextStyles.caption.copyWith(
                                color: product.stockCount > 0 ? AppColors.success : AppColors.error,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10.0),

                      // Price & Quantity Control Action Bar
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Price Display
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.baseline,
                            textBaseline: TextBaseline.alphabetic,
                            children: [
                              Text(
                                '₹${displayPrice.toStringAsFixed(0)}',
                                style: AppTextStyles.price.copyWith(fontSize: 18),
                              ),
                              if (oldPrice != null && oldPrice > displayPrice) ...[
                                const SizedBox(width: 6.0),
                                Text(
                                  '₹${oldPrice.toStringAsFixed(0)}',
                                  style: AppTextStyles.priceOld,
                                ),
                              ],
                            ],
                          ),

                          // Add / Quantity Stepper Button
                          if (isLoading)
                            const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2.0, color: AppColors.primary),
                            )
                          else if (product.stockCount <= 0)
                            Text(
                              'Sold Out',
                              style: AppTextStyles.caption.copyWith(color: AppColors.textMuted),
                            )
                          else if (productInCart && onIncrement != null && onDecrement != null)
                            Container(
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(8.0),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    visualDensity: VisualDensity.compact,
                                    constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                                    padding: EdgeInsets.zero,
                                    icon: const Icon(Icons.remove, size: 16, color: Colors.white),
                                    onPressed: onDecrement ?? () {},
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 4.0),
                                    child: Text(
                                      '$quantityInCart',
                                      style: AppTextStyles.bodyMedium.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  IconButton(
                                    visualDensity: VisualDensity.compact,
                                    constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                                    padding: EdgeInsets.zero,
                                    icon: const Icon(Icons.add, size: 16, color: Colors.white),
                                    onPressed: onIncrement ?? () {},
                                  ),
                                ],
                              ),
                            )
                          else if (productInCart)
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.softGreen,
                                foregroundColor: AppColors.primary,
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 8.0),
                                minimumSize: const Size(0, 34),
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8.0),
                                ),
                              ),
                              onPressed: () {
                                context.pushNamed('cart');
                              },
                              icon: const Icon(Icons.shopping_cart_checkout, size: 15),
                              label: const Text('In Cart', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                            )
                          else
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 8.0),
                                minimumSize: const Size(0, 34),
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8.0),
                                ),
                              ),
                              onPressed: onAddToCart,
                              icon: const Icon(Icons.add_shopping_cart, size: 15),
                              label: const Text('Add', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
