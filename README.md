# FoodTime Android Prototype

This is a minimal Android APK framework for the FoodTime prototype.

The current implementation loads the existing `index.html` and `styles.css` through a native Android WebView, so the visual prototype can be packaged quickly while local data storage is designed next.

## Build

Open this folder in Android Studio, let Gradle sync, then run:

```powershell
gradle assembleDebug
```

or use Android Studio's Run button.

## GitHub Actions

The workflow at `.github/workflows/android-debug.yml` builds a debug APK on `main`/`master` pushes or manual dispatch.

After a successful run, download the APK from the `FoodTime-debug-apk` artifact.

## Current Scope

- Static prototype UI loaded from `app/src/main/assets/index.html`
- No server sync
- No Room database yet
- Local storage/data layer to be added in the next implementation pass
