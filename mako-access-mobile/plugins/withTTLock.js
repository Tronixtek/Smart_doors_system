const { withMainActivity, withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

const withTTLockMainActivity = (config) => {
  return withMainActivity(config, (config) => {
    const mainActivity = config.modResults;
    
    if (mainActivity.language === 'java') {
        // Java implementation
        if (!mainActivity.contents.includes('import com.facebook.react.ReactInstanceManager;')) {
            mainActivity.contents = mainActivity.contents.replace(
              /package com\.mako\.access;/,
              `package com.mako.access;\n\nimport com.facebook.react.ReactInstanceManager;\nimport com.reactnativettlock.TtlockModule;`
            );
          }
      
          const method = `
  @Override
  public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    ReactInstanceManager mReactInstanceManager = getReactNativeHost().getReactInstanceManager();
    TtlockModule ttlockModule = mReactInstanceManager.getCurrentReactContext().getNativeModule(TtlockModule.class);
    if (ttlockModule != null) {
       ttlockModule.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
  }
`;
          if (!mainActivity.contents.includes('onRequestPermissionsResult')) {
            mainActivity.contents = mainActivity.contents.replace(
              /public class MainActivity extends ReactActivity \{/,
              `public class MainActivity extends ReactActivity {${method}`
            );
          }
    } else {
        // Kotlin implementation
        if (!mainActivity.contents.includes('import com.reactnativettlock.TtlockModule')) {
            mainActivity.contents = mainActivity.contents.replace(
              /package com\.mako\.access/,
              `package com.mako.access\n\nimport com.reactnativettlock.TtlockModule`
            );
          }
      
          const method = `
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        val mReactInstanceManager = reactNativeHost.reactInstanceManager
        val ttlockModule = mReactInstanceManager.currentReactContext?.getNativeModule(TtlockModule::class.java)
        ttlockModule?.onRequestPermissionsResult(requestCode, permissions, grantResults)
    }
`;
          if (!mainActivity.contents.includes('onRequestPermissionsResult')) {
            mainActivity.contents = mainActivity.contents.replace(
              /class MainActivity : ReactActivity\(\) \{/,
              `class MainActivity : ReactActivity() {${method}`
            );
          }
    }

    return config;
  });
};

const withTTLockAndroidManifest = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;
    
    androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    if (androidManifest.application && androidManifest.application[0]) {
      androidManifest.application[0].$['tools:replace'] = 'android:label';
    }

    return config;
  });
};

const withTTLockBuildGradle = (config) => {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            // Disable minify in release as required by TTLock SDK
            if (!config.modResults.contents.includes('minifyEnabled false')) {
                config.modResults.contents = config.modResults.contents.replace(
                    /release \{/,
                    `release {
            minifyEnabled false
            shrinkResources false`
                );
            }
        }
        return config;
    });
}

module.exports = (config) => {
  config = withTTLockMainActivity(config);
  config = withTTLockAndroidManifest(config);
  config = withTTLockBuildGradle(config);
  return config;
};
