import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../models/order/order.dart';
import '../../theme/colors.dart';
import '../../theme/text_styles.dart';

class OrderCard extends StatelessWidget {
  final OrderData order;
  final ValueChanged<String>? onClick;

  const OrderCard({
    super.key,
    required this.order,
    this.onClick,
  });

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return const Color(/* Amber/Orange */ 0xFFE65100);
      case 'delivered':
        return const Color(/* Emerald Green */ 0xFF1B5E20);
      case 'cancelled':
        return const Color(/* Rose Red */ 0xFFC62828);
      default:
        return AppColors.primary;
    }
  }

  Color _getStatusBgColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return const Color(0xFFFFF3E0);
      case 'delivered':
        return const Color(0xFFE8F5E9);
      case 'cancelled':
        return const Color(0xFFFFEBEE);
      default:
        return AppColors.softGreen;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormatted = DateFormat('dd MMM yyyy • hh:mm a').format(order.createdAt.toLocal());
    final statusColor = _getStatusColor(order.status);
    final statusBgColor = _getStatusBgColor(order.status);
    final statusText = _getStatusText(order.status);

    final productTitles = order.items.map((item) => item.title).join(', ');
    final totalItemsCount = order.items.fold<int>(0, (sum, item) => sum + item.quantity);

    // Get up to 3 image URLs
    final List<String> images = [];
    for (final item in order.items) {
      for (final img in item.imageURLs) {
        if (img.isNotEmpty && !images.contains(img)) {
          images.add(img);
        }
        if (images.length >= 3) break;
      }
      if (images.length >= 3) break;
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16.0),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: Colors.grey.shade200, width: 1),
      ),
      child: InkWell(
        onTap: () {
          if (onClick != null) {
            onClick!(order.id);
          }
        },
        borderRadius: BorderRadius.circular(16.0),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Header Row: Order ID + Status Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Order #${order.id.substring(order.id.length > 8 ? order.id.length - 8 : 0).toUpperCase()}',
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          dateFormatted,
                          style: AppTextStyles.caption.copyWith(
                            color: AppColors.textMuted,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10.0, vertical: 5.0),
                    decoration: BoxDecoration(
                      color: statusBgColor,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: statusColor.withValues(alpha: 0.3), width: 1),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: statusColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          statusText,
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12.0),
                child: Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
              ),

              // Middle Row: Product Image Thumbnails + Items info
              Row(
                children: [
                  // Images Preview Stack
                  if (images.isNotEmpty)
                    SizedBox(
                      height: 56,
                      child: Row(
                        children: images.map((imgUrl) {
                          return Container(
                            margin: const EdgeInsets.only(right: 6.0),
                            width: 52,
                            height: 52,
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: CachedNetworkImage(
                                imageUrl: imgUrl,
                                fit: BoxFit.cover,
                                errorWidget: (context, url, error) => const Icon(Icons.shopping_basket_rounded, size: 24, color: AppColors.textMuted),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    )
                  else
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.softGreen,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.shopping_bag_outlined, color: AppColors.primary, size: 26),
                    ),

                  const SizedBox(width: 12),

                  // Title & Total Items Count
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          productTitles,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$totalItemsCount ${totalItemsCount == 1 ? "Item" : "Items"}',
                          style: AppTextStyles.caption.copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),

                  // Total Amount
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Total',
                        style: AppTextStyles.caption.copyWith(fontSize: 10, color: AppColors.textMuted),
                      ),
                      Text(
                        '₹${order.amount.toStringAsFixed(2)}',
                        style: AppTextStyles.sectionTitle.copyWith(
                          fontSize: 16,
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Bottom Actions Row
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary, width: 1.2),
                        padding: const EdgeInsets.symmetric(vertical: 8.0),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        if (onClick != null) {
                          onClick!(order.id);
                        }
                      },
                      icon: const Icon(Icons.receipt_long_rounded, size: 16),
                      label: const Text('View Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  if (order.status.toLowerCase() == 'delivered') ...[
                    const SizedBox(width: 8.0),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 8.0),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () {
                          context.pushNamed(
                            'reviewableProducts',
                            pathParameters: {'orderId': order.id},
                          );
                        },
                        icon: const Icon(Icons.star_rounded, size: 16),
                        label: const Text('Write Review', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
