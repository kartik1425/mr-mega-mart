import 'package:mrmegamart_app/models/payment/create_payment_intent_response.dart';
import 'package:mrmegamart_app/services/payment_api_service.dart';

class PaymentRepository {

  final PaymentApiService paymentApiService;

  PaymentRepository(this.paymentApiService);

  Future<CreatePaymentIntentResponse> createPaymentIntent({List<Map<String, dynamic>>? items}) async {
    try {
      final CreatePaymentIntentResponse response = await paymentApiService.createPaymentIntent(items: items);
      return response;
    } catch (e) {
      throw Exception('Failed to create payment intent: $e');
    }
  }


}
