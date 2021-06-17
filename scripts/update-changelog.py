import argparse
import sys
import re

# Parses a comment that must follow the strict rule of being:
# <trigger expression>
# Message: <some one line message here>
# User: <some user name here>
# And updates the the changelog file to include the new information

# Global settings
g_prefix_line = '-   '
g_begin_changes = '<!--- Begin changes - Do not remove -->'
g_end_changes = '<!--- End changes - Do not remove -->'
g_begin_users = '<!--- Begin users - Do not remove -->'
g_end_users = '<!--- End users - Do not remove -->'

def remove_prefix(text: str, prefix: str) -> str:
    """Remove the prefix from the string"""
    return re.sub(r'^{0}'.format(re.escape(prefix)), '', text)

def get_sorted_unique_entries(entries) -> list:
    """Return a sorted list of unique entries"""
    entries = list(set(entries))
    entries.sort()
    return [('{}{}'.format(g_prefix_line, entry) if entry else '') for entry in entries]

def get_updated_file_content(current_changelog_lines: str, new_change: any, new_user: any) -> list:
    """Returns the list of content for the updated changelog"""
    new_file_content = []
    is_sourcing_changes = False
    is_sourcing_users = False
    changes = [new_change] if new_change else []
    users = [new_user] if new_user else []
    processed_info = False

    for line in current_changelog_lines:
        line = line.strip()
        if line == g_end_changes:
            is_sourcing_changes = False
            new_file_content.extend(get_sorted_unique_entries(changes))
            # adds an extra item to avoid issues with the linter
            new_file_content.append('')

        if line == g_end_users:
            is_sourcing_users = False
            new_file_content.extend(get_sorted_unique_entries(users))
            # adds an extra item to avoid issues with the linter
            new_file_content.append('')
            # stop processing changelog, but needs to read the remaining of the code anyway
            processed_info = True

        if processed_info or (not is_sourcing_changes and not is_sourcing_users):
            new_file_content.append(line)

        if is_sourcing_changes:
            changes.append(remove_prefix(line, g_prefix_line))

        if is_sourcing_users:
            users.append(remove_prefix(line, g_prefix_line))

        if line == g_begin_changes:
            is_sourcing_changes = True

        if line == g_begin_users:
            is_sourcing_users = True

    # Include on extra empty line to comply with markdown formatter
    new_file_content.append('')
    return new_file_content

def update_changelog(changelog_filename: str, new_change: any, new_user: any):
    """Updates the changelog file to include the new changes"""
    new_file_content = []
    with open(changelog_filename) as file_handler:
        lines = file_handler.readlines()
        new_file_content = get_updated_file_content(lines, new_change, new_user)

    with open(changelog_filename, "w") as file_handler:
        file_handler.write('\n'.join(new_file_content))

def get_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("-changelog-file", help="Changelog file")
    parser.add_argument("-changes-file", help="Changes file, containing 'Message' and 'User'")
    return parser.parse_args()

def get_change_and_user(changes_file: str) -> list:
    """Parses changes file retrieving Message and User"""
    message = None
    user = None
    with open(changes_file) as file_handler:
        for line in file_handler.readlines():
            match = re.match("Message: (.*)", line.strip())
            if match:
                message = match.group(1)

            match = re.match("User: (.*)", line.strip())
            if match:
                user = match.group(1)

    return [message, user]

def main():
    args = get_arguments()
    [message, user] = get_change_and_user(args.changes_file)
    if message or user:
        update_changelog(args.changelog_file, message, user)

if __name__ == "__main__":
    main()