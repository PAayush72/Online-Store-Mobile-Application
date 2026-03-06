import React from 'react';
import { WebView } from 'react-native-webview';
import { View, ActivityIndicator, Modal, StyleSheet } from 'react-native';

const RazorpayCheckout = ({ paymentData, onSuccess, onFailure }) => {
  const generateHTML = () => `
    <!DOCTYPE html>
    <html>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
          const options = {
            key: '${paymentData.key}',
            amount: '${paymentData.amount}',
            currency: '${paymentData.currency}',
            name: '${paymentData.name}',
            description: '${paymentData.description}',
            image: '${paymentData.image}',
            handler: function(response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'success',
                response: response
              }));
            },
            prefill: {
              name: '${paymentData.prefill.name}',
              email: '${paymentData.prefill.email}',
              contact: '${paymentData.prefill.contact}'
            },
            theme: {
              color: '${paymentData.theme.color}'
            },
            modal: {
              ondismiss: function() {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  status: 'dismissed'
                }));
              }
            }
          };
          
          const rzp1 = new Razorpay(options);
          rzp1.on('payment.failed', function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              status: 'failed',
              response: response
            }));
          });
          rzp1.open();
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      switch (data.status) {
        case 'success':
          onSuccess(data.response);
          break;
        case 'failed':
          onFailure(data.response);
          break;
        case 'dismissed':
          onFailure({ error: 'Payment cancelled' });
          break;
        default:
          onFailure({ error: 'Unknown response' });
      }
    } catch (error) {
      onFailure({ error: 'Invalid response' });
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={() => onFailure({ error: 'Payment cancelled' })}
    >
      <View style={styles.modalContainer}>
        <View style={styles.webViewContainer}>
          <WebView
            source={{ html: generateHTML() }}
            onMessage={handleMessage}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <ActivityIndicator
                size="large"
                color="#4CAF50"
                style={styles.loader}
              />
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  loader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RazorpayCheckout; 