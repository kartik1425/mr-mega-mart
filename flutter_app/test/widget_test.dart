import 'package:flutter_test/flutter_test.dart';
import 'package:mrmegamart_app/di/locator.dart';
import 'package:mrmegamart_app/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('MR Mega Mart app initialization smoke test', (WidgetTester tester) async {
    setupLocator();
    await tester.pumpWidget(const MyApp());
    expect(find.byType(MyApp), findsOneWidget);
  });
}
