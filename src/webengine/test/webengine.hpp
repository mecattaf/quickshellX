#pragma once

#include <qobject.h>
#include <qtmetamacros.h>

class WebEngineInitTest: public QObject {
	Q_OBJECT;

private slots:
	static void init();
};
