import { enforceConfigurationHardening } from '../utils/config-hardening'

export default defineNitroPlugin(() => {
  enforceConfigurationHardening()
})
