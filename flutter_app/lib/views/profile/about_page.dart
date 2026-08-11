import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mrmegamart_app/theme/colors.dart';
import 'package:mrmegamart_app/theme/text_styles.dart';

class AboutPage extends StatelessWidget {
  const AboutPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('About MR Mega Mart'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 12.0),
            // Logo Branding Container
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(24.0),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x201A602B),
                    blurRadius: 16.0,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.shopping_basket_rounded,
                size: 52,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16.0),
            Text(
              'MR Mega Mart',
              style: AppTextStyles.display.copyWith(fontSize: 26, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4.0),
            Text(
              'Version 1.0.0+1 (Staging Release)',
              style: AppTextStyles.caption.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24.0),

            // Description Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16.0),
                border: Border.all(color: AppColors.border),
              ),
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Commercial Grocery Platform',
                    style: AppTextStyles.sectionTitle.copyWith(fontSize: 16),
                  ),
                  const SizedBox(height: 8.0),
                  Text(
                    'MR Mega Mart is a modern grocery shopping application engineered for fast local delivery, intuitive product discovery, and seamless checkout. Experience fresh produce, daily essentials, and exclusive deals at your fingertips.',
                    style: AppTextStyles.body.copyWith(color: AppColors.textSecondary, height: 1.5),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16.0),

            // Features Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16.0),
                border: Border.all(color: AppColors.border),
              ),
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Key Features',
                    style: AppTextStyles.sectionTitle.copyWith(fontSize: 16),
                  ),
                  const SizedBox(height: 12.0),
                  _buildFeatureRow(Icons.eco_outlined, '100% Fresh Produce & Daily Essentials'),
                  _buildFeatureRow(Icons.bolt_outlined, 'Express Local Staging Delivery'),
                  _buildFeatureRow(Icons.security_outlined, 'Secure Authentication & Account Privacy'),
                  _buildFeatureRow(Icons.local_offer_outlined, 'Weekly Promotional Deals & Discount Slashing'),
                ],
              ),
            ),
            const SizedBox(height: 40.0),

            // Subtle Developer Attribution Footer
            Text(
              'Made by Kartik Gupta',
              style: AppTextStyles.caption.copyWith(
                color: AppColors.textMuted,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 20.0),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.primary),
          const SizedBox(width: 12.0),
          Expanded(
            child: Text(
              text,
              style: AppTextStyles.bodyMedium.copyWith(fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
