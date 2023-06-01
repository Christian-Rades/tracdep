#! b/usr/bin/env awk

/^\/.*.php$/ { 
    filename = $0; 
    depCnt = 0
    namespace = ""
}

/^use/ { sub(/;$/, ""); deps[depCnt++] = $2};

/^namespace/ { sub(/;$/, ""); namespace = $2 }

/^final class/ { classname = $3; print $3 }
/^abstract class/ { classname = $3 }
/^class/ { classname = $2 }
/^interface/ { classname = $2 }
/^trait/ { classname = $2 }

length(classname) > 0 { 
    fqn = namespace "\\" classname;

    units[unitCnt++] = fqn;

    line = fqn ", " filename;
    hasFile = 0;
    for (i = 0; i < depCnt; i++) {
        line = line ", " deps[i] 
    }
    print line;
    depCnt = 0;
    classname = "";
}

END { 
    if (length(filename) > 0) {
        print filename; 
    }

    print "known units: " unitCnt > "/dev/stderr";
    for (i = 0; i < unitCnt; i++) {
        print units[i] > "/dev/stderr";
    }
}
