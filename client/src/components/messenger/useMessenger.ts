import { useMessengerStore } from '../../stores/messengerStore';

export function useMessenger() {
  return useMessengerStore();
}
