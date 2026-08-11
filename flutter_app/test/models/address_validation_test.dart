import 'package:flutter_test/flutter_test.dart';
import 'package:mrmegamart_app/models/address/address.dart';

void main() {
  group('Address Model Tests', () {
    test('Address.fromJson parses valid JSON correctly', () {
      final json = {
        '_id': 'addr_101',
        'userId': 'usr_999',
        'fullName': 'Kartik Gupta',
        'phoneNumber': '9876543210',
        'address': '123 Emerald Street, Sector 4',
        'city': 'New Delhi',
        'state': 'Delhi',
        'postalCode': '110001',
        'country': 'India',
        'addressType': 'Home',
        'isDefault': true,
        'createdAt': '2026-08-10T10:00:00.000Z',
      };

      final address = Address.fromJson(json);

      expect(address.id, equals('addr_101'));
      expect(address.fullName, equals('Kartik Gupta'));
      expect(address.address, equals('123 Emerald Street, Sector 4'));
      expect(address.city, equals('New Delhi'));
      expect(address.postalCode, equals('110001'));
      expect(address.addressType, equals('Home'));
      expect(address.isDefault, isTrue);
    });

    test('Address.toJson produces correct Map output', () {
      final address = Address(
        id: 'addr_102',
        userId: 'usr_999',
        fullName: 'Kartik Gupta',
        phoneNumber: '9876543210',
        address: '45 Tech Park',
        city: 'Gurugram',
        state: 'Haryana',
        postalCode: '122002',
        country: 'India',
        addressType: 'Office',
        isDefault: false,
        createdAt: DateTime.parse('2026-08-10T10:00:00.000Z'),
      );

      final json = address.toJson();

      expect(json['_id'], equals('addr_102'));
      expect(json['addressType'], equals('Office'));
      expect(json['city'], equals('Gurugram'));
      expect(json['isDefault'], isFalse);
    });
  });
}
