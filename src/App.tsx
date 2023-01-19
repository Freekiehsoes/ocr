// Copyright (C) 2021, Mindee.

// This program is licensed under the Apache License version 2.
// See LICENSE or go to <https://www.apache.org/licenses/LICENSE-2.0.txt> for full license details.

import { Grid, makeStyles, Theme } from "@material-ui/core";
import { COLORS } from "@mindee/web-elements.assets";
import { BrowserView } from "react-device-detect";
import VisionWrapper from "./components/VisionWrapper";

const useStyles = makeStyles((theme: Theme) => ({
  wrapper: {
    height: "100vh",
    width: "100%",
  },
  content: {
    background: COLORS.background,
    paddingLeft: 42,
    paddingRight: 42,
    paddingTop: 10,
    marginTop: 0.5,
  },
}));

function App() {
  const classes = useStyles();
  return (
    <>
      <BrowserView>
        <Grid className={classes.wrapper} container>
          <Grid spacing={1} className={classes.content} item container xs={12}>
            <Grid item xs={12}>
              <VisionWrapper />
            </Grid>
          </Grid>
        </Grid>
      </BrowserView>
    </>
  );
}

export default App;
