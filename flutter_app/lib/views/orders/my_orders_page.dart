import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:mrmegamart_app/bloc/orders/get/get_orders_bloc.dart';
import 'package:mrmegamart_app/bloc/orders/get/get_orders_event.dart';
import 'package:mrmegamart_app/bloc/orders/get/get_orders_state.dart';
import 'package:mrmegamart_app/components/app_bar_with_back_button.dart';
import 'package:mrmegamart_app/theme/colors.dart';
import 'package:mrmegamart_app/theme/text_styles.dart';
import '../../components/order/order_card.dart';

class MyOrdersPage extends StatefulWidget {
  final bool fromAccount;

  const MyOrdersPage({super.key, required this.fromAccount});

  @override
  State<MyOrdersPage> createState() => _MyOrdersPageState();
}

class _MyOrdersPageState extends State<MyOrdersPage> {
  late GetOrdersBloc _getOrdersBloc;
  final ScrollController _scrollController = ScrollController();
  int _currentPage = 1;
  String _selectedStatusFilter = 'ALL'; // ALL, PENDING, DELIVERED

  @override
  void initState() {
    super.initState();
    _getOrdersBloc = GetOrdersBloc();
    _fetchOrders();

    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 &&
          !_getOrdersBloc.state.isLoading &&
          _getOrdersBloc.state.getUserOrdersResponse != null &&
          _currentPage < _getOrdersBloc.state.getUserOrdersResponse!.totalPages) {
        _currentPage++;
        _getOrdersBloc.add(UserOrdersRequested(page: _currentPage));
      }
    });
  }

  @override
  void dispose() {
    _getOrdersBloc.close();
    _scrollController.dispose();
    super.dispose();
  }

  void _fetchOrders() {
    _currentPage = 1;
    _getOrdersBloc.add(const UserOrdersRequested(page: 1));
  }

  Future<void> _onRefresh() async {
    _fetchOrders();
    await Future.delayed(const Duration(milliseconds: 600));
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _getOrdersBloc,
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBarWithBackButton(
          title: "My Orders",
          onBackClicked: () {
            if (widget.fromAccount) {
              context.pop();
            } else {
              context.goNamed("mainPage");
            }
          },
        ),
        body: Column(
          children: [
            // Filter Pills Bar (ALL, PENDING, DELIVERED)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                children: [
                  _buildFilterPill('ALL', 'All Orders'),
                  const SizedBox(width: 8),
                  _buildFilterPill('PENDING', 'Pending'),
                  const SizedBox(width: 8),
                  _buildFilterPill('DELIVERED', 'Delivered'),
                ],
              ),
            ),
            const Divider(height: 1, thickness: 1, color: Color(0xFFE2E8F0)),

            // Main List View
            Expanded(
              child: BlocBuilder<GetOrdersBloc, GetOrdersState>(
                builder: (context, state) {
                  if (state.isLoading && state.getUserOrdersResponse == null) {
                    return const Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    );
                  }

                  if (state.isFailure && state.getUserOrdersResponse == null) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: const BoxDecoration(
                                color: Color(0xFFFFEBEE),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 36),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              state.errorMessage ?? "Failed to load orders.",
                              textAlign: TextAlign.center,
                              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              onPressed: _fetchOrders,
                              icon: const Icon(Icons.refresh_rounded, size: 18),
                              label: const Text('Try Again', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  if (state.getUserOrdersResponse != null) {
                    final allOrders = state.getUserOrdersResponse!.orders;

                    // Apply status filter
                    final filteredOrders = allOrders.where((order) {
                      if (_selectedStatusFilter == 'ALL') return true;
                      return order.status.toUpperCase() == _selectedStatusFilter;
                    }).toList();

                    if (filteredOrders.isEmpty) {
                      return RefreshIndicator(
                        onRefresh: _onRefresh,
                        color: AppColors.primary,
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          child: Container(
                            height: MediaQuery.of(context).size.height * 0.65,
                            alignment: Alignment.center,
                            padding: const EdgeInsets.all(32.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  width: 90,
                                  height: 90,
                                  decoration: const BoxDecoration(
                                    color: AppColors.softGreen,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.shopping_bag_outlined,
                                    size: 44,
                                    color: AppColors.primary,
                                  ),
                                ),
                                const SizedBox(height: 20),
                                Text(
                                  _selectedStatusFilter == 'ALL'
                                      ? "No Orders Found"
                                      : "No $_selectedStatusFilter Orders",
                                  style: AppTextStyles.sectionTitle.copyWith(fontSize: 18),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _selectedStatusFilter == 'ALL'
                                      ? "Looks like you haven't placed any orders yet. Start exploring our fresh groceries today!"
                                      : "You currently have no orders matching the '$_selectedStatusFilter' status.",
                                  textAlign: TextAlign.center,
                                  style: AppTextStyles.bodyText.copyWith(color: AppColors.textSecondary),
                                ),
                                const SizedBox(height: 24),
                                ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  onPressed: () {
                                    context.goNamed('mainPage');
                                  },
                                  icon: const Icon(Icons.storefront_rounded, size: 20),
                                  label: const Text('Start Shopping', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }

                    return RefreshIndicator(
                      onRefresh: _onRefresh,
                      color: AppColors.primary,
                      child: ListView.builder(
                        controller: _scrollController,
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.only(top: 8.0, bottom: 24.0),
                        itemCount: filteredOrders.length + 1,
                        itemBuilder: (context, index) {
                          if (index == filteredOrders.length) {
                            if (state.isLoading) {
                              return const Padding(
                                padding: EdgeInsets.all(16.0),
                                child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                              );
                            }
                            return const SizedBox.shrink();
                          }

                          return OrderCard(
                            order: filteredOrders[index],
                            onClick: (orderId) {
                              context.pushNamed(
                                "orderDetailsFromMyOrder",
                                pathParameters: {"orderId": orderId},
                              );
                            },
                          );
                        },
                      ),
                    );
                  }

                  return const SizedBox.shrink();
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterPill(String filterKey, String label) {
    final isSelected = _selectedStatusFilter == filterKey;
    return InkWell(
      onTap: () {
        setState(() {
          _selectedStatusFilter = filterKey;
        });
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 6.0),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade300,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}
