import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:mrmegamart_app/bloc/auth/sign_out/sign_out_bloc.dart';
import 'package:mrmegamart_app/bloc/auth/sign_out/sign_out_event.dart';
import 'package:mrmegamart_app/bloc/auth/sign_out/sign_out_state.dart';
import 'package:mrmegamart_app/theme/colors.dart';

class AccountPage extends StatefulWidget {
  const AccountPage({super.key});

  @override
  State<AccountPage> createState() => _AccountPageState();
}

class _AccountPageState extends State<AccountPage> {
  late SignOutBloc _signOutBloc;

  @override
  void initState() {
    super.initState();
    _signOutBloc = SignOutBloc();
  }

  @override
  void dispose() {
    _signOutBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => _signOutBloc,
      child: BlocConsumer<SignOutBloc, SignOutState>(
        listener: (context, state) {
          if (state.isSuccess) {
            context.goNamed("login");
          }

          if (state.isFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text("Sign out failed: ${state.errorMessage}"),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state.isLoading) {
            return const Scaffold(
              body: Center(
                child: CircularProgressIndicator(),
              ),
            );
          }

          return Scaffold(
            backgroundColor: AppColors.surface,
            appBar: AppBar(
              title: const Text(
                "My Account",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              centerTitle: true,
              backgroundColor: Colors.white,
              foregroundColor: AppColors.textPrimary,
              elevation: 0,
              scrolledUnderElevation: 0,
            ),
            body: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile Header Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16.0),
                    margin: const EdgeInsets.only(bottom: 16.0),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16.0),
                      border: Border.all(color: AppColors.border, width: 1.0),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: const BoxDecoration(
                            color: AppColors.softGreen,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.person, color: AppColors.primary, size: 28),
                        ),
                        const SizedBox(width: 14.0),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'MR Mega Mart Customer',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                              ),
                              SizedBox(height: 2.0),
                              Text(
                                'Manage account & preferences',
                                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Section 1: Account & Profile
                  _buildSectionHeader('ACCOUNT'),
                  _buildGroupCard([
                    _buildListTile(
                      icon: Icons.person_outline,
                      title: "Personal Information",
                      onTap: () => context.pushNamed('myProfilePage'),
                    ),
                    _buildListTile(
                      icon: Icons.location_on_outlined,
                      title: "Delivery Addresses",
                      onTap: () => context.pushNamed('myAddresses'),
                    ),
                  ]),

                  // Section 2: Orders & Activity
                  _buildSectionHeader('ORDERS & SAVED'),
                  _buildGroupCard([
                    _buildListTile(
                      icon: Icons.receipt_long_outlined,
                      title: "My Orders",
                      onTap: () => context.pushNamed('myOrders', pathParameters: {'fromAccount': "1"}),
                    ),
                    _buildListTile(
                      icon: Icons.favorite_border_rounded,
                      title: "Favourite Products",
                      onTap: () => context.pushNamed("favouriteProducts"),
                    ),
                    _buildListTile(
                      icon: Icons.workspace_premium_outlined,
                      title: "My Subscription",
                      onTap: () => context.pushNamed('mySubscription'),
                    ),
                  ]),

                  // Section 3: Legal & Support
                  _buildSectionHeader('SUPPORT & LEGAL'),
                  _buildGroupCard([
                    _buildListTile(
                      icon: Icons.info_outline_rounded,
                      title: "About MR Mega Mart",
                      onTap: () => context.pushNamed('aboutPage'),
                    ),
                    _buildListTile(
                      icon: Icons.privacy_tip_outlined,
                      title: "Privacy Policy",
                      onTap: () => context.pushNamed('privacyPolicyPage'),
                    ),
                  ]),

                  // Section 4: Session
                  _buildSectionHeader('SESSION'),
                  _buildGroupCard([
                    _buildListTile(
                      icon: Icons.logout_rounded,
                      title: "Sign Out",
                      titleColor: AppColors.error,
                      iconColor: AppColors.error,
                      onTap: () => _signOutBloc.add(const SignOutRequested()),
                    ),
                  ]),

                  const SizedBox(height: 24.0),
                  const Center(
                    child: Text(
                      'Made by Kartik Gupta',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF94A3B8),
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24.0),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4.0, bottom: 6.0, top: 10.0),
      child: Text(
        title,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary, letterSpacing: 0.8),
      ),
    );
  }

  Widget _buildGroupCard(List<Widget> children) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12.0),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14.0),
        border: Border.all(color: AppColors.border, width: 1.0),
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color titleColor = AppColors.textPrimary,
    Color iconColor = AppColors.primary,
  }) {
    return ListTile(
      leading: Icon(icon, color: iconColor, size: 22),
      title: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: titleColor)),
      trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
      onTap: onTap,
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 2.0),
    );
  }
}
