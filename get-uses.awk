
/^use/ {
    sub(/;$/, "");
    deps[$2] = 1
    len = split($2, a, "\\")
    if (len > 1) {
        imports[a[len]] = 1
    }
}

/^namespace/ { sub(/;$/, ""); namespace = $2 }

match($0, /^#\[Package\(['"].+['"]\)/) {
    sub(/#\[Package\(["']/, "");
    sub(/['"]\).*$/, "");
    package = $0;
}

/^final class/ { classname = $3;}
/^abstract class/ { classname = $3 }
/^class/ { classname = $2 }
/^interface/ { classname = $2 }
/^trait/ { classname = $2 }
/class.*extends/ {
    line = $0
    sub(/^.*extends[[:space:]]/, "", line);
    sub(/implements[[:space:]].*$/, "", line);
    sub(/[[:space:]]*[{].*$/, "", line);
    if (imports[line] != 1 && line !~ /^\\/) {
        fqn = namespace "\\" line;
        deps[fqn] = 1;
    }
}


/class.*implements/ {
    line = $0
    sub(/^.*implements[[:space:]]/, "", line);
    sub(/extends[[:space:]].*$/, "", line);
    sub(/[[:space:]]*[{].*$/, "", line);
    len = split(line, a, ",")
    for (i = 1; i <= len; i++) {
        interface = a[i];
        gsub(/[[:space:]]/, "", interface);
        #skip builtin interfaces
        if (interface ~ /^\\/) {
            continue;
        }
        if (imports[interface] != 1) {
            fqn = namespace "\\" interface;
            deps[fqn] = 1;
        }
    }
}

/new [A-Z a-z 0-9 _]*\(/ {
    if (length(classname) == 0) {
        next;
    }
    line = $0
    sub(/^.*new[[:space:]]/, "", line);
    sub(/[(].*$/, "", line);
    if (imports[line] != 1 && line !~ /^(\\|self|static)/) {
        fqn = namespace "\\" line;
        deps[fqn] = 1;
    }
}

/^\/.*.php$/ && classname == "" {
    classname = "";
    package = "";
    delete deps;
    delete imports;
    depCnt = 0
    namespace = ""
}

/^\/.*.php$/ && classname != "" { 
    fqn = namespace "\\" classname;

    units[unitCnt++] = fqn;

    line = fqn ", " package;
    hasFile = 0;
    for (dep in deps) {
        line = line ", " dep 
    }
    print line;
    classname = "";
    package = "";
    delete deps;
    delete imports;
    depCnt = 0
    namespace = ""
}

END { 
    if (classname != "") {
        fqn = namespace "\\" classname;
        units[unitCnt++] = fqn;
        line = fqn ", " package;
        hasFile = 0;
        for (dep in deps) {
            line = line ", " dep 
        }
        print line;
    }
    print "known units: " unitCnt > "/dev/stderr";
    for (i = 0; i < unitCnt; i++) {
        print units[i] > "/dev/stderr";
    }
}
