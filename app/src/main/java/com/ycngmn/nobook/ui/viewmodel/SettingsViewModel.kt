package com.ycngmn.nobook.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.ycngmn.nobook.data.local.SettingsDataStore
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.AMOLED_BLACK
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.DESKTOP_LAYOUT
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.ENABLE_COPY_TO_CLIPBOARD
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.ENABLE_DOWNLOAD_CONTENT
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.HIDE_GROUPS
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.HIDE_PEOPLE_YOU_MAY_KNOW
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.HIDE_REELS
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.HIDE_STORIES
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.HIDE_SUGGESTED
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.IMMERSIVE_MODE
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.LANDSCAPE_MODE
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.PINCH_TO_ZOOM
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.REEL_AUTOPLAY
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.STORY_AUTOPLAY
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.REMOVE_ADS
import com.ycngmn.nobook.data.local.SettingsDataStore.Companion.STICKY_NAVBAR
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking


class SettingsViewModel(
    application: Application,
) : AndroidViewModel(application) {

    private val dataStore: SettingsDataStore = SettingsDataStore(application)

    private val initialPrefs = runBlocking { dataStore.prefs.first() }

    /** Every setting at once; the settings dialog compares it to tell whether anything changed. */
    // Eagerly: the dialog snapshots it on open, so it must already hold the current values.
    val allPrefs = dataStore.prefs.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs,
        started = SharingStarted.Eagerly
    )

    // Every setting below is read with .value (e.g. MainViewModel.loadScripts) as well as
    // collected by the UI, so it has to follow the stored value even while nothing collects it.
    val removeAds = dataStore.removeAds.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[REMOVE_ADS] ?: true,
        started = SharingStarted.Eagerly
    )
    val enableDownloadContent = dataStore.enableDownloadContent.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[ENABLE_DOWNLOAD_CONTENT] ?: true,
        started = SharingStarted.Eagerly
    )
    val enableCopyToClipboard = dataStore.enableCopyToClipboard.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[ENABLE_COPY_TO_CLIPBOARD] ?: false,
        started = SharingStarted.Eagerly
    )
    val reelAutoplay = dataStore.reelAutoplay.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[REEL_AUTOPLAY] ?: true,
        started = SharingStarted.Eagerly
    )
    val storyAutoplay = dataStore.storyAutoplay.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[STORY_AUTOPLAY] ?: true,
        started = SharingStarted.Eagerly
    )
    val desktopLayout = dataStore.desktopLayout.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[DESKTOP_LAYOUT] ?: false,
        started = SharingStarted.Eagerly
    )
    val immersiveMode = dataStore.immersiveMode.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[IMMERSIVE_MODE] ?: false,
        started = SharingStarted.Eagerly
    )
    val landscapeMode = dataStore.landscapeMode.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[LANDSCAPE_MODE] ?: true,
        started = SharingStarted.Eagerly
    )
    val stickyNavbar = dataStore.stickyNavbar.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[STICKY_NAVBAR] ?: false,
        started = SharingStarted.Eagerly
    )
    val pinchToZoom = dataStore.pinchToZoom.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[PINCH_TO_ZOOM] ?: false,
        started = SharingStarted.Eagerly
    )
    val amoledBlack = dataStore.amoledBlack.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[AMOLED_BLACK] ?: false,
        started = SharingStarted.Eagerly
    )
    val hideSuggested = dataStore.hideSuggested.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[HIDE_SUGGESTED] ?: false,
        started = SharingStarted.Eagerly
    )
    val hideReels = dataStore.hideReels.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[HIDE_REELS] ?: false,
        started = SharingStarted.Eagerly
    )
    val hideStories = dataStore.hideStories.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[HIDE_STORIES] ?: false,
        started = SharingStarted.Eagerly
    )
    val hidePeopleYouMayKnow = dataStore.hidePeopleYouMayKnow.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[HIDE_PEOPLE_YOU_MAY_KNOW] ?: false,
        started = SharingStarted.Eagerly
    )
    val hideGroups = dataStore.hideGroups.stateIn(
        scope = viewModelScope,
        initialValue = initialPrefs[HIDE_GROUPS] ?: false,
        started = SharingStarted.Eagerly
    )
    val isRevertDesktop = dataStore.revertDesktop.stateIn(
        scope = viewModelScope,
        initialValue = false,
        started = SharingStarted.Eagerly
    )

    fun setRemoveAds(removeAds: Boolean) {
        viewModelScope.launch {
            dataStore.setRemoveAds(removeAds)
        }
    }

    fun setEnableDownloadContent(enableDownloadContent: Boolean) {
        viewModelScope.launch {
            dataStore.setEnableDownloadContent(enableDownloadContent)
        }
    }

    fun setEnableCopyToClipboard(enableCopyToClipboard: Boolean) {
        viewModelScope.launch {
            dataStore.setEnableCopyToClipboard(enableCopyToClipboard)
        }
    }

    fun setReelAutoplay(reelAutoplay: Boolean) {
        viewModelScope.launch {
            dataStore.setReelAutoplay(reelAutoplay)
        }
    }

    fun setStoryAutoplay(storyAutoplay: Boolean) {
        viewModelScope.launch {
            dataStore.setStoryAutoplay(storyAutoplay)
        }
    }

    fun setDesktopLayout(desktopLayout: Boolean) {
        viewModelScope.launch {
            dataStore.setDesktopLayout(desktopLayout)
        }
    }

    fun setImmersiveMode(immersiveMode: Boolean) {
        viewModelScope.launch {
            dataStore.setImmersiveMode(immersiveMode)
        }
    }

    fun setLandscapeMode(landscapeMode: Boolean) {
        viewModelScope.launch {
            dataStore.setLandscapeMode(landscapeMode)
        }
    }

    fun setStickyNavbar(stickyNavbar: Boolean) {
        viewModelScope.launch {
            dataStore.setStickyNavbar(stickyNavbar)
        }
    }

    fun setPinchToZoom(pinchToZoom: Boolean) {
        viewModelScope.launch {
            dataStore.setPinchToZoom(pinchToZoom)
        }
    }

    fun setAmoledBlack(amoledBlack: Boolean) {
        viewModelScope.launch {
            dataStore.setAmoledBlack(amoledBlack)
        }
    }

    fun setHideSuggested(hideSuggested: Boolean) {
        viewModelScope.launch {
            dataStore.setHideSuggested(hideSuggested)
        }
    }

    fun setHideReels(hideReels: Boolean) {
        viewModelScope.launch {
            dataStore.setHideReels(hideReels)
        }
    }

    fun setHideStories(hideStories: Boolean) {
        viewModelScope.launch {
            dataStore.setHideStories(hideStories)
        }
    }

    fun setHidePeopleYouMayKnow(hidePeopleYouMayKnow: Boolean) {
        viewModelScope.launch {
            dataStore.setHidePeopleYouMayKnow(hidePeopleYouMayKnow)
        }
    }

    fun setHideGroups(hideGroups: Boolean) {
        viewModelScope.launch {
            dataStore.setHideGroups(hideGroups)
        }
    }

    fun setRevertDesktop(revertDesktop: Boolean) {
        viewModelScope.launch {
            dataStore.setRevertDesktop(revertDesktop)
        }
    }
}