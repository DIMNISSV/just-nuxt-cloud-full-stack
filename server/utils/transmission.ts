import Transmission from 'transmission-promise'
import { runtimeConfig } from '../../config'

const transmissionConfig = runtimeConfig.transmission

if (!transmissionConfig?.host || !transmissionConfig.port) {
    throw new Error('Конфигурация Transmission не заполнена. Проверьте ваш config.ts')
}

// Создаем единственный экземпляр клиента
export const transmission = new Transmission({
    host: transmissionConfig.host,
    port: transmissionConfig.port,
    // username: transmissionConfig.username, // Раскомментируйте, если используете
    // password: transmissionConfig.password, // Раскомментируйте, если используете
})