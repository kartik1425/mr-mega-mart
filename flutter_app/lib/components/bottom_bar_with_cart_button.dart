import 'package:flutter/material.dart';
import 'package:mrmegamart_app/theme/colors.dart';

class BottomBarWithCartButton extends StatelessWidget {
  final double price;
  final double? salePrice;
  final double cargoWeight;
  final VoidCallback onAddToCart;
  final VoidCallback? onBuyNow;
  final bool isAddToCartActive;
  final bool isLoading;
  final String buttonText;

  const BottomBarWithCartButton({
    super.key,
    required this.price,
    this.salePrice,
    required this.cargoWeight,
    required this.onAddToCart,
    this.onBuyNow,
    this.isAddToCartActive = true,
    this.isLoading = false,
    this.buttonText = "Add to Cart",
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: true,
      top: false,
      left: false,
      right: false,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: AppColors.border, width: 1.0),
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
        child: Row(
          children: [
            // Price & Delivery Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (salePrice != null)
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          "₹${salePrice!.toStringAsFixed(0)}",
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          "₹${price.toStringAsFixed(0)}",
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textMuted,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    )
                  else
                    Text(
                      "₹${price.toStringAsFixed(0)}",
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(
                        Icons.bolt_rounded,
                        color: AppColors.primary,
                        size: 16,
                      ),
                      const SizedBox(width: 2),
                      Flexible(
                        child: Text(
                          "Same-Day Delivery",
                          style: TextStyle(
                            color: Colors.green.shade700,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Action Buttons Row: Add to Cart + Buy Now
            Row(
              children: [
                OutlinedButton(
                  onPressed: isAddToCartActive && !isLoading ? onAddToCart : null,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary, width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    minimumSize: const Size(0, 42),
                  ),
                  child: isLoading
                      ? const SizedBox(
                          height: 18,
                          width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2.0, color: AppColors.primary),
                        )
                      : Text(buttonText, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                ),
                if (onBuyNow != null) ...[
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: isAddToCartActive && !isLoading ? onBuyNow : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      minimumSize: const Size(0, 42),
                    ),
                    child: const Text('Buy Now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
