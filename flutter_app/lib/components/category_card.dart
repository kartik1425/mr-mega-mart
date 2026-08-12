import 'package:flutter/material.dart';
import 'package:mrmegamart_app/theme/colors.dart';
import '../models/category/category.dart';

class CategoryCard extends StatelessWidget {
  final Category category;
  final VoidCallback onCategoryClicked;

  const CategoryCard({
    super.key,
    required this.category,
    required this.onCategoryClicked,
  });

  IconData _getCategoryIcon(String name) {
    final lowerName = name.toLowerCase();
    if (lowerName.contains('veg') || lowerName.contains('fruit')) return Icons.eco_outlined;
    if (lowerName.contains('bakery') || lowerName.contains('bread')) return Icons.bakery_dining_outlined;
    if (lowerName.contains('meat') || lowerName.contains('kebab')) return Icons.kebab_dining_outlined;
    if (lowerName.contains('dairy') || lowerName.contains('milk')) return Icons.water_drop_outlined;
    if (lowerName.contains('snack') || lowerName.contains('biscuit')) return Icons.cookie_outlined;
    return Icons.grid_view_rounded;
  }

  @override
  Widget build(BuildContext context) {
    final iconData = _getCategoryIcon(category.name);

    return InkWell(
      onTap: onCategoryClicked,
      borderRadius: BorderRadius.circular(16.0),
      child: Container(
        width: 100,
        height: 100,
        padding: const EdgeInsets.all(10.0),
        decoration: BoxDecoration(
          color: AppColors.softGreen,
          borderRadius: BorderRadius.circular(16.0),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.2), width: 1.0),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8.0),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(iconData, color: AppColors.primary, size: 24),
            ),
            const SizedBox(height: 8.0),
            Text(
              category.name,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
                height: 1.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
