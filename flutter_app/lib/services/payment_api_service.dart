import 'package:get_it/get_it.dart';
import 'package:mrmegamart_app/models/payment/create_payment_intent_response.dart';
import '../utils/api_endpoints.dart';
import '../utils/networking_manager.dart';

class PaymentApiService{
  final NetworkingManager _networkingManager = GetIt.instance<NetworkingManager>();

  Future<CreatePaymentIntentResponse> createPaymentIntent({List<Map<String, dynamic>>? items}) async {
    try {
      final response = await _networkingManager.post(
        endpoint: ApiEndpoints.createPaymentIntent,
        addAuthToken: true,
        body: items != null && items.isNotEmpty ? {'items': items} : {},
      );
      return CreatePaymentIntentResponse.fromJson(response);
    }
    catch (e) {
      throw Exception('Failed to create payment intent: $e');
    }
  }


}
