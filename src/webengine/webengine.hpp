#pragma once

#include <qdebug.h>
#include <qlibrary.h>
#include <qlogging.h>

namespace qs::web_engine {

inline bool init() {
	using InitializeFunc = void (*)();

	QLibrary lib("Qt6WebEngineQuick", 6);
	if (!lib.load()) {
		qWarning() << "Failed to load library:" << lib.errorString();
		qWarning() << "You might need to install the necessary package for Qt6WebEngineQuick.";
		qWarning() << "QtWebEngineQuick is not loaded. Using the qml type WebEngineView from"
		              " QtWebEngine might lead to undefined behaviour!";
		return false;
	}

	qDebug() << "Loaded library Qt6WebEngineQuick";

	auto initialize =
	    reinterpret_cast<InitializeFunc>(lib.resolve("_ZN16QtWebEngineQuick10initializeEv")); // NOLINT
	if (!initialize) {
		qWarning() << "Failed to resolve symbol 'void QtWebEngineQuick::initialize()' in lib"
		              " Qt6WebEngineQuick. This should not happen.";
		qWarning() << "QtWebEngineQuick is not loaded. Using the qml type WebEngineView from"
		              " QtWebEngine might lead to undefined behaviour!";
		return false;
	}

	qDebug() << "Found symbol QtWebEngineQuick::initialize(). Initializing WebEngine...";

	initialize();

	qWarning() << "WebEngine initialized. Note: WebEngine is incompatible with jemalloc."
	              " If quickshell crashes immediately, rebuild with -DUSE_JEMALLOC=OFF.";

	qDebug() << "Successfully initialized QtWebEngineQuick";
	return true;
}

} // namespace qs::web_engine
