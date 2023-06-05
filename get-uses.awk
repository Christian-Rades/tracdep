/^\/.*.php$/ { 
    depCnt = 0
    namespace = ""
}

/^use/ { sub(/;$/, ""); deps[depCnt++] = $2};

/^namespace/ { sub(/;$/, ""); namespace = $2 }

match($0, /^#\[Package\(['"].+['"]\)/) {
    line = $0;
    sub(/#\[Package\(["']/, "", line);
    sub(/['"]\).*$/, "", line);
    package = line;
}

/^final class/ { classname = $3;}
/^abstract class/ { classname = $3 }
/^class/ { classname = $2 }
/^interface/ { classname = $2 }
/^trait/ { classname = $2 }

length(classname) > 0 { 
    gsub(/[;{}]/, "", classname);
    fqn = namespace "\\" classname;

    units[unitCnt++] = fqn;

    line = fqn ", " package;
    if (depCnt > 0) {
        line = line ", ";
    }
    for (i = 0; i < depCnt; i++) {
        line = line ", " deps[i] 
    }
    print line;
    depCnt = 0;
    classname = "";
}

END { 
    print "known units: " unitCnt > "/dev/stderr";
    for (i = 0; i < unitCnt; i++) {
        print units[i] > "/dev/stderr";
    }
}
