import 'package:equatable/equatable.dart';

abstract class PaymentEvent extends Equatable {
  const PaymentEvent();

  @override
  List<Object?> get props => [];
}

class PaymentIntentRequested extends PaymentEvent {
  final List<Map<String, dynamic>>? items;
  const PaymentIntentRequested({this.items});

  @override
  List<Object?> get props => [items];
}
