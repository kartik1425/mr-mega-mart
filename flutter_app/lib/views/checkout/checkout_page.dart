import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:go_router/go_router.dart';
import 'package:mrmegamart_app/bloc/address/address_bloc.dart';
import 'package:mrmegamart_app/bloc/address/address_event.dart';
import 'package:mrmegamart_app/bloc/cart/get/get_cart_bloc.dart';
import 'package:mrmegamart_app/bloc/cart/get/get_cart_event.dart';
import 'package:mrmegamart_app/bloc/cart/get/get_cart_state.dart';
import 'package:mrmegamart_app/bloc/payment/payment_bloc.dart';
import 'package:mrmegamart_app/bloc/payment/payment_event.dart';
import 'package:mrmegamart_app/bloc/payment/payment_state.dart';
import 'package:mrmegamart_app/components/app_bar_with_back_button.dart';
import 'package:mrmegamart_app/models/cart/cart.dart';
import 'package:mrmegamart_app/theme/colors.dart';
import '../../bloc/address/address_state.dart';
import '../../components/checkout/checkout_address_section.dart';
import '../../components/checkout/checkout_delivery_date_section.dart';
import '../../components/checkout/checkout_order_summary_section.dart';
import '../../components/buttons/custom_button.dart';
import 'package:mrmegamart_app/services/orders_api_service.dart';

class CheckoutPage extends StatefulWidget {
  final CartItem? directItem;

  const CheckoutPage({super.key, this.directItem});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  late AddressBloc _addressBloc;
  late GetCartBloc _cartBloc;
  late PaymentBloc _paymentBloc;
  String _paymentMethod = 'COD'; // Default to Cash on Delivery
  bool _isProcessingCod = false;

  @override
  void initState() {
    super.initState();
    _addressBloc = AddressBloc();
    _cartBloc = GetCartBloc();
    _paymentBloc = PaymentBloc();
    _fetchDefaultAddress();
    if (widget.directItem == null) {
      _fetchCart();
    }
  }

  @override
  void dispose() {
    _addressBloc.close();
    _cartBloc.close();
    _paymentBloc.close();
    super.dispose();
  }

  void _fetchDefaultAddress() {
    _addressBloc.add(const GetDefaultAddressEvent());
  }

  void _fetchCart() {
    _cartBloc.add(UserCartRequested());
  }

  Future<void> _navigateToAddressForm({address}) async {
    final result = await context.pushNamed(
      'addressForm',
      extra: address,
    );

    if (result == "success") {
      _fetchDefaultAddress();
    }
  }

  Future<void> _showPaymentSheet({required String clientSecret, required String paymentIntentId}) async {
    try {
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          style: ThemeMode.system,
          merchantDisplayName: 'MR Mega Mart',
        ),
      );

      await Stripe.instance.presentPaymentSheet();

      if (mounted) {
        context.goNamed(
          'paymentSuccessful',
          pathParameters: {
            'paymentIntentId': paymentIntentId,
          },
        );
      }
    } on StripeException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Payment failed: ${e.error.localizedMessage}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('An error occurred while processing payment.')),
        );
      }
    }
  }

  Widget _buildCheckoutContent(Cart cart) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 10),
          CheckoutAddressSection(
            onEditAddress: (address) {
              _navigateToAddressForm(address: address);
            },
          ),
          const SizedBox(height: 20),
          const DeliveryDateSection(),
          const SizedBox(height: 20),

          // Payment Method Options Card
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14.0),
              border: Border.all(color: AppColors.border, width: 1.0),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Select Payment Method',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 10.0),
                RadioListTile<String>(
                  value: 'COD',
                  groupValue: _paymentMethod,
                  activeColor: AppColors.primary,
                  contentPadding: EdgeInsets.zero,
                  title: const Row(
                    children: [
                      Icon(Icons.money_rounded, color: AppColors.primary, size: 20),
                      SizedBox(width: 8),
                      Text('Cash on Delivery (COD)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    ],
                  ),
                  subtitle: const Text('Pay when your groceries arrive', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  onChanged: (val) {
                    setState(() {
                      _paymentMethod = val!;
                    });
                  },
                ),
                const Divider(height: 1),
                RadioListTile<String>(
                  value: 'CARD',
                  groupValue: _paymentMethod,
                  activeColor: AppColors.primary,
                  contentPadding: EdgeInsets.zero,
                  title: const Row(
                    children: [
                      Icon(Icons.credit_card_rounded, color: AppColors.primary, size: 20),
                      SizedBox(width: 8),
                      Text('Online Payment (Card / Stripe / UPI)', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    ],
                  ),
                  subtitle: const Text('Secure instant checkout', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  onChanged: (val) {
                    setState(() {
                      _paymentMethod = val!;
                    });
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          OrderSummarySection(cart: cart),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (context) => _addressBloc),
        BlocProvider(create: (context) => _cartBloc),
        BlocProvider(create: (context) => _paymentBloc),
      ],
      child: Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBarWithBackButton(
          title: widget.directItem != null ? "Buy Now Checkout" : "Checkout",
          onBackClicked: () => context.pop(),
        ),
        body: widget.directItem != null
            ? _buildCheckoutContent(
                Cart(
                  ownerId: 'direct_purchase',
                  items: [widget.directItem!],
                  updatedAt: DateTime.now(),
                  cargoFee: (widget.directItem!.price * widget.directItem!.quantity) >= 500 ? 0.0 : 40.0,
                ),
              )
            : BlocBuilder<GetCartBloc, GetCartState>(
                builder: (context, cartState) {
                  if (cartState.isLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (cartState.isFailure) {
                    return Center(
                      child: Text(
                        "Error loading cart: ${cartState.errorMessage}",
                        style: const TextStyle(color: Colors.red),
                      ),
                    );
                  }

                  if (cartState.isSuccess && cartState.cartResponse != null) {
                    final cart = cartState.cartResponse!.cart;
                    return _buildCheckoutContent(cart);
                  }

                  return const Center(child: Text("Cart is empty."));
                },
              ),
        bottomNavigationBar: SafeArea(
          child: BlocConsumer<PaymentBloc, PaymentState>(
            listener: (context, state) {
              if (state.isSuccess && state.createPaymentIntentResponse != null) {
                final clientSecret = state.createPaymentIntentResponse!.paymentIntent.clientSecret;
                final paymentIntentId = state.createPaymentIntentResponse!.paymentIntent.id;
                _showPaymentSheet(clientSecret: clientSecret, paymentIntentId: paymentIntentId);
              }
            },
            builder: (context, state) {
              return BlocBuilder<AddressBloc, AddressState>(
                builder: (context, addressState) {
                  final hasDefaultAddress = addressState.address != null;
                  return Container(
                    color: Colors.white,
                    padding: const EdgeInsets.only(left: 16, right: 16, bottom: 20, top: 10),
                    child: CustomButton(
                      text: (_isProcessingCod || state.isLoading)
                          ? "Placing Order..."
                          : (_paymentMethod == 'COD' ? "Place Order (Cash on Delivery)" : "Pay Now (Online)"),
                      textColor: Colors.white,
                      color: AppColors.primary,
                      isLoading: _isProcessingCod || state.isLoading,
                      onClick: () async {
                        if (_isProcessingCod || state.isLoading) return;
                        if (!hasDefaultAddress) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text("Please select or add a delivery address to continue!"),
                              backgroundColor: AppColors.error,
                            ),
                          );
                          return;
                        }

                        final itemsPayload = widget.directItem != null
                            ? [
                                {
                                  'productId': widget.directItem!.productId,
                                  'quantity': widget.directItem!.quantity,
                                  'price': widget.directItem!.price,
                                }
                              ]
                            : null;

                        if (_paymentMethod == 'COD') {
                          setState(() { _isProcessingCod = true; });
                          try {
                            final res = await OrdersApiService().createCodOrder(items: itemsPayload);
                            if (!mounted) return;
                            setState(() { _isProcessingCod = false; });
                            final order = res['order'];
                            final paymentId = order != null && order['paymentId'] != null
                                ? order['paymentId'].toString()
                                : 'COD-${DateTime.now().millisecondsSinceEpoch}';
                            context.goNamed(
                              'paymentSuccessful',
                              pathParameters: {
                                'paymentIntentId': paymentId,
                              },
                            );
                          } catch (err) {
                            if (!mounted) return;
                            setState(() { _isProcessingCod = false; });
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text("Failed to place COD order: ${err.toString().replaceAll('Exception: ', '')}"),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          }
                        } else {
                          context.read<PaymentBloc>().add(PaymentIntentRequested(items: itemsPayload));
                        }
                      },
                    ),
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }
}
